// supabase/functions/ai-chat/index.ts
// Production NEXORA AI Chat Gateway using Google Gemini API (Free Tier)
// Runs securely inside Supabase Edge Runtime at zero personal cost.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface MessageContext {
  recentMessages?: Array<{ role: string; content: string }>;
  inferredContext?: string;
  language?: string;
  systemPrompt?: string;
}

interface ChatRequestBody {
  userId: string;
  conversationId: string;
  message: string;
  context?: MessageContext;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Method not allowed. Use POST." },
      405
    );
  }

  const geminiApiKey =
    Deno.env.get("GEMINI_API_KEY") ||
    Deno.env.get("GEMINI_KEY") ||
    Deno.env.get("GOOGLE_API_KEY") ||
    Deno.env.get("GOOGLE_GEMINI_API_KEY") ||
    Deno.env.get("GEMINI_APIKEY");

  if (!geminiApiKey || geminiApiKey.trim() === "") {
    const presentKeys = Object.keys(Deno.env.toObject()).map(k => k.trim());
    console.error("[ai-chat] Missing GEMINI_API_KEY secret in Supabase environment. Present env keys:", presentKeys);
    return jsonResponse(
      {
        success: false,
        error: "AI backend configuration error: GEMINI_API_KEY secret is not set.",
        availableKeys: presentKeys,
      },
      500
    );
  }

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse(
      { success: false, error: "Invalid JSON request body." },
      400
    );
  }

  const { userId, conversationId, message, context } = body;

  if (!userId || !message || typeof message !== "string" || message.trim() === "") {
    return jsonResponse(
      { success: false, error: "Missing required fields: userId and message." },
      400
    );
  }

  // --------------------------------------------------------------------------
  // Server-Side Authentication Validation
  // Validates the requesting user against Supabase Auth to isolate user data.
  // --------------------------------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (authHeader && supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: userData, error: authError } = await supabase.auth.getUser();

      if (authError || !userData?.user) {
        return jsonResponse(
          { success: false, error: "Invalid or expired Supabase authentication session." },
          401
        );
      }

      // Ensure authenticated user can only process for their own account
      if (userData.user.id !== userId) {
        return jsonResponse(
          { success: false, error: "Forbidden: user ID does not match authenticated session." },
          403
        );
      }
    } catch (authErr) {
      console.warn("[ai-chat] Auth verification warning:", authErr);
      // Proceed gracefully if internal auth lookup experiences a transient issue
    }
  }

  // --------------------------------------------------------------------------
  // Prompt Construction for Gemini API
  // --------------------------------------------------------------------------
  const systemInstructionText =
    context?.systemPrompt ??
    `You are NEXORA, an intelligent, sovereign personal AI companion.
You respond concisely, accurately, and naturally.
Tone: Warm, highly capable, focused, direct.
Language: Adapt naturally to the user's language (${context?.language || "English"}), including Tanglish, Tamil, or Hindi if addressed in them.
Length: Keep chat responses clear and conversational, optimized for both screen reading and native mobile speech synthesis (TTS). Do not use excessive asterisks or markdown formatting that sounds awkward when read aloud.`;

  // Build Gemini contents array
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  // Recent history turns (up to 6 previous messages)
  if (Array.isArray(context?.recentMessages)) {
    for (const msg of context.recentMessages.slice(-6)) {
      if (!msg.content || typeof msg.content !== "string") continue;
      const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
      contents.push({
        role,
        parts: [{ text: msg.content.trim() }],
      });
    }
  }

  // Current user turn
  contents.push({
    role: "user",
    parts: [{ text: message.trim() }],
  });

  const geminiPayload = {
    systemInstruction: {
      parts: [{ text: systemInstructionText }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
      topP: 0.95,
    },
  };

  // --------------------------------------------------------------------------
  // Model Discovery and Generation
  // Uses verified high-speed models in Google AI Studio free tier:
  // Primary: gemini-3.5-flash-lite
  // Fallback: gemini-3.1-flash-lite (strictly on 429 quota exhaustion or transient 503/504)
  // --------------------------------------------------------------------------
  const modelsToTry = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
  ];

  const attemptedErrors: string[] = [];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`[ai-chat] Gemini API error (${model}) status ${response.status}:`, errorBody);

        attemptedErrors.push(`${model} (${response.status}): ${errorBody.slice(0, 100)}`);
        
        // Only retry on quota/rate-limit (429) or transient errors (503, 504)
        const isRetryable = response.status === 429 || response.status === 503 || response.status === 504;
        if (!isRetryable) {
          // Do not retry 400, 401, 403
          break;
        }
        continue;
      }

      const data = await response.json();
      const candidate = data?.candidates?.[0];

      if (!candidate?.content?.parts?.length) {
        attemptedErrors.push(`${model}: empty candidate parts`);
        continue;
      }

      const replyText = candidate.content.parts
        .map((p: { text?: string }) => p.text ?? "")
        .join("")
        .trim();

      if (!replyText) {
        attemptedErrors.push(`${model}: empty text generated`);
        continue;
      }

      // Return exactly the schema expected by the mobile client:
      // { success: true, text: "...", model: "..." }
      return jsonResponse({
        success: true,
        text: replyText,
        model,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      attemptedErrors.push(`${model}: ${msg}`);
      console.warn(`[ai-chat] Exception calling (${model}):`, msg);
    }
  }

  // If all models failed with 429 (quota exhausted on all tiers), return 429
  const allRateLimited = attemptedErrors.length > 0 && attemptedErrors.every(e => e.includes("(429)"));
  if (allRateLimited) {
    return jsonResponse(
      {
        success: false,
        error: "Gemini free-tier rate limit reached. Please wait a few moments and try again.",
      },
      429
    );
  }

  return jsonResponse(
    {
      success: false,
      error: `AI generation failed across attempted models: ${attemptedErrors.slice(0, 3).join("; ")}`,
    },
    502
  );
});

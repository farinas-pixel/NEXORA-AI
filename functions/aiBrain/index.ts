// Supabase Edge Function: AI Brain using HuggingFace free inference API
// No secret is exposed to the client. The HuggingFace token must be stored as a Supabase secret
// named HUGGINGFACE_API_TOKEN.

import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";

// Model endpoint (free, public). You can replace with any other free model.
const HF_MODEL = "facebook/blenderbot-400M-distill";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// Retrieve the token from Supabase secrets (environment variable). It must be set manually.
const HF_TOKEN = Deno.env.get("HUGGINGFACE_API_TOKEN");
if (!HF_TOKEN) {
  console.error("HUGGINGFACE_API_TOKEN not set in Supabase environment");
}

// Helper to call HuggingFace inference API
async function queryHF(prompt: string): Promise<string> {
  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace API error ${response.status}: ${err}`);
  }
  const data = await response.json();
  // The returned structure for this model is { generated_text: "..." }
  if (Array.isArray(data)) {
    // Some models return array of objects with generated_text
    return data.map((d: any) => d.generated_text ?? "").join(" ");
  }
  return data.generated_text ?? data[0]?.generated_text ?? "";
}

serve(async (req) => {
  try {
    const { userId, conversationId, message, context } = await req.json();
    if (!userId || !conversationId || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }
    // Assemble a minimal prompt: system prompt + recent context + user message
    const systemPrompt = context?.systemPrompt ?? "You are NEXORA, a helpful personal AI assistant. Answer concisely and honestly.";
    const recentHistory = context?.recentMessages?.map((m: any) => `${m.role}: ${m.content}`).join("\n") ?? "";
    const fullPrompt = `${systemPrompt}\n${recentHistory}\nUser: ${message}\nAssistant:`;
    const aiAnswer = await queryHF(fullPrompt);
    return new Response(JSON.stringify({ reply: aiAnswer.trim() }), { status: 200 });
  } catch (e: any) {
    console.error("AI function error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Internal error" }), { status: 500 });
  }
});

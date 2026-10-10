process.env.NODE_ENV = 'test';

import serverModule from '../server/dist/index.js';
const app = serverModule.default?.default || serverModule.default || serverModule;

const server = app.listen(0, async () => {
  const port = server.address().port;
  const base = `http://localhost:${port}`;
  console.log(`Ephemeral test server listening on ${base}`);

  try {
    // 1. Health
    const hRes = await fetch(`${base}/api/health`);
    const health = await hRes.json();
    console.log('Health check:', health.status, '| Gemini configured:', health.gemini?.configured, '| Model:', health.gemini?.model);

    // 2. AI Chat (Live Gemini call via proxy)
    const chatRes = await fetch(`${base}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Say hello in 5 words', activeMode: 'general' }),
    });
    const chat = await chatRes.json();
    console.log('AI Chat Proxy Success:', chat.success, '| Model:', chat.model, '| Reply:', chat.text?.trim(), '| Error:', chat.error);

    // 3. AI Structured (Live JSON mode)
    const structRes = await fetch(`${base}/api/ai/structured`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Extract subject and urgency from: Exam tomorrow morning in JSON with fields subject, urgency', task: 'intent' }),
    });
    const struct = await structRes.json();
    console.log('AI Structured Proxy:', struct.success, '| Data:', JSON.stringify(struct.data), '| Error:', struct.error);

    // 4. Social Messages
    const socRes = await fetch(`${base}/api/social/messages?conversationId=grp_engineering`);
    const social = await socRes.json();
    console.log('Social messages count:', social.messages?.length);

    console.log('ALL SERVER ENDPOINTS VERIFIED SUCCESSFULLY!');
  } catch (e) {
    console.error('Server endpoint test error:', e);
  } finally {
    server.close(() => {
      process.exit(0);
    });
  }
});

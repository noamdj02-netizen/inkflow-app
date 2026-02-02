import { GoogleGenAI } from '@google/genai';

function json(res: { status: (n: number) => void; setHeader: (k: string, v: string) => void; end: (s: string) => void }, status: number, body: unknown) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

type Body = { message?: string; artistName?: string };

export default async function handler(req: { method?: string; body?: string }, res: { status: (n: number) => void; setHeader: (k: string, v: string) => void; end: (s: string) => void }) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    return json(res, 500, { error: 'Configuration IA manquante (GEMINI_API_KEY)' });
  }

  let body: Body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const MAX_MESSAGE_LENGTH = 2000;
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_MESSAGE_LENGTH) : '';
  const artistName = typeof body.artistName === 'string' ? body.artistName.trim().slice(0, 100) : 'le studio';

  if (!message) {
    return json(res, 400, { error: 'Missing field: message' });
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `Tu es un consultant expert en tatouage pour le studio de ${artistName}. Tu donnes des conseils professionnels sur :
- Les styles de tatouage et leur signification
- Les emplacements idéaux selon la taille et le design
- Les soins post-tatouage
- Les préparations avant la session
- Les prix estimatifs
- Les questions de douleur et de durée

Réponds de manière concise (2-3 phrases max), amicale et professionnelle. Si la question n'est pas liée au tatouage, redirige poliment vers le sujet.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `${systemPrompt}\n\nQuestion du client: ${message}`,
      config: {
        maxOutputTokens: 512,
        temperature: 0.7,
      },
    });

    const text = (response as { text?: string }).text ?? '';
    const responseText = (typeof text === 'string' ? text.trim() : '') || 'Désolé, je ne peux pas répondre actuellement.';

    return json(res, 200, { response: responseText });
  } catch (err) {
    console.error('tattoo-advice API error:', err);
    return json(res, 200, {
      response: "Désolé, je rencontre un problème. Réessayez dans un instant.",
    });
  }
}

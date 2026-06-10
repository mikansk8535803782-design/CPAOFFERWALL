// Vercel serverless function — POST /api/chat
// Provides Gemini-powered support assistant for EarnHub.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  try {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: { 'User-Agent': 'earnhub-vercel' },
      },
    });
    return aiClient;
  } catch (err) {
    console.error('Gemini init failed:', err);
    return null;
  }
}

function buildFallback(message: string, userContext: any): string {
  const lower = (message || '').toLowerCase();
  let base = `Standard helpdesk reply for "${message}".`;
  if (lower.includes('point') || lower.includes('task')) {
    base += ` You currently have ${userContext?.points ?? 0} points with ${userContext?.tasksCompleted ?? 0} tasks completed. Pending submissions are admin-audited and typically clear within 4–12 hours.`;
  } else if (lower.includes('withdraw') || lower.includes('payout')) {
    base += ` Your wallet balance is ₹${userContext?.balance ?? 0}. Minimum withdrawal is ₹100 via UPI, USDT TRC20 or BEP20.`;
  } else {
    base += ` For urgent help, please raise a ticket from the Support section.`;
  }
  return base;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userContext } = (req.body || {}) as { message?: string; userContext?: any };
  if (!message) {
    return res.status(400).json({ error: 'Message input is required' });
  }

  const client = getGeminiClient();
  if (!client) {
    return res.status(200).json({ text: buildFallback(message, userContext) });
  }

  const systemInstruction = `
You are the official Support Bot for EarnHub, a micro-earnings platform for India.
Be polite, precise and concise (1–3 lines).
Use the live account metrics below for context.

User Profile:
- Name: ${userContext?.name || 'User'} (ID: ${userContext?.id || 'N/A'})
- Role: ${userContext?.role || 'user'}
- Points: ${userContext?.points ?? 0}
- Wallet Balance: ₹${userContext?.balance ?? 0}
- Completed Tasks: ${userContext?.tasksCompleted ?? 0}
- Referrals: ${userContext?.refs ?? 0}

Latest Task Status: ${userContext?.lastTaskStatus || 'No records.'}
Latest Payout Status: ${userContext?.lastPayoutStatus || 'No withdrawal requests.'}

Rules:
- Conversion: 20 Points = ₹1.
- Minimum withdrawal: ₹100 via UPI, USDT TRC20 or BEP20.
- Task points are credited after manual admin audit (4–12 hours).
`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: { systemInstruction, temperature: 0.7 },
    });
    return res.status(200).json({ text: response.text || 'Got it. I will review and reply shortly.' });
  } catch (err) {
    console.error('Gemini error:', err);
    return res.status(200).json({ text: buildFallback(message, userContext) });
  }
}

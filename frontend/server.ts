import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Lazily initialize Gemini client to avoid crashes if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        console.log('Gemini API client initialized successfully.');
      } catch (err) {
        console.error('Failed to initialize Gemini API client:', err);
      }
    } else {
      console.warn('Note: GEMINI_API_KEY environment variable is not defined or is placeholder. Falling back to rule-based static replies.');
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard middleware
  app.use(express.json());

  // API Route: Live chatbot proxy route
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, userContext } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message input is required' });
      }

      const client = getGeminiClient();
      if (!client) {
        // Safe context-aware static fallback if API key is missing
        let fallbackMsg = `Standard helpdesk automated reply: We received your query about "${message}".`;
        if (message.toLowerCase().includes('point') || message.toLowerCase().includes('task')) {
          fallbackMsg += ` Since you have ${userContext?.points ?? 0} points with ${userContext?.tasksCompleted ?? 0} tasks completed, any pending points are currently held in verification queues. Admin usually reviews reviews within 4-12 hours!`;
        } else if (message.toLowerCase().includes('withdraw') || message.toLowerCase().includes('payout')) {
          fallbackMsg += ` Your balance is currently ₹${userContext?.balance ?? 0}. Please note that withdrawals require a minimum threshold of ₹100 via UPI, TRC20, or BEP20. All ledger records are stored on the InstantDB chain!`;
        } else {
          fallbackMsg += ` Our administrators have been notified of your inquiry. If urgent, please submit a support ticket in the Support Helpdesk section!`;
        }
        return res.json({ text: fallbackMsg });
      }

      // Contextual Gemini instructions with live user stats
      const systemInstruction = `
You are the official Support Bot for EarnHub, the multi-level micro-earnings workspace and local PDF processing suites.
Provide crisp, polite, precise helpdesk or technical answers.
Keep answers friendly, expert, and concise (usually 1-3 lines max).
Utilize the live account metrics of the user specified below for custom support context.

User Profile context:
- Name: ${userContext?.name || 'User'} (ID: ${userContext?.id || 'N/A'})
- Role: ${userContext?.role || 'user'}
- Points: ${userContext?.points ?? 0}
- Current Cash Balance: ₹${userContext?.balance ?? 0}
- Cumulative Completed Tasks: ${userContext?.tasksCompleted ?? 0}
- Referral Invite Count: ${userContext?.refs ?? 0}

User's Latest Task Ledger status:
${userContext?.lastTaskStatus || 'No records in Task_Ledger queue.'}

User's Latest Payout status:
${userContext?.lastPayoutStatus || 'No withdrawal requests in payouts queue.'}

Rules of operation:
- Convert policy: 20 Points = ₹1.
- Minimum withdrawal threshold: ₹100 via UPI, USDT TRC20, or BEP20.
- If they claim they didn't get points, let them know that screen proofs or task entries undergo manual audit by the admin and are normally credited in 4-12 hours.
`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || `I received your message. Let me review that for you!`;
      return res.json({ text: replyText });

    } catch (error: any) {
      console.error('Error generating chat via Gemini:', error);
      return res.status(500).json({ error: 'System internal error or rate limit hit. Try again in a brief moment.' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite Hot Module Replacement loaded in middleware mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production-ready compiled production assets build.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EarnHub server online on port ${PORT}`);
  });
}

startServer();

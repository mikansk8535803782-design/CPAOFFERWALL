# EarnHub

Micro-tasks + CPA + 3-tier referral platform for India.
React + Vite + InstantDB (email-OTP) + Vercel serverless.

---

## 🚀 Deploy to Vercel (Plug & Play)

This repo is **pre-configured** for Vercel. No "Root Directory" setting needed —
just import the repo and deploy.

### Steps:

1. **Get an InstantDB App ID**
   - <https://www.instantdb.com/dash> → create app → copy App ID
2. **Import the repo on Vercel**
   - <https://vercel.com/new> → select this GitHub repo → continue
3. **Add Environment Variables** (Settings → Environment Variables):

   | Key | Value | Scope | Required |
   |---|---|---|---|
   | `VITE_INSTANT_APP_ID` | Your InstantDB App ID | Client+Server | ✅ |
   | `INSTANT_APP_ID` | Same as above | Server | ✅ |
   | `INSTANT_ADMIN_TOKEN` | From InstantDB → Settings → Admin → Generate | Server | ✅ |
   | `VITE_CPALEAD_PUBLISHER_ID` | Your CPALead publisher ID | Client+Server | ✅ for CPA |
   | `CPALEAD_PUBLISHER_ID` | Same as above | Server | ✅ for CPA |
   | `CPALEAD_POSTBACK_PASSWORD` | A 24+ char secret (`openssl rand -hex 24`) | Server | ✅ for CPA |
   | `CPALEAD_API_KEY` | If your CPALead account requires one | Server | Optional |
   | `GEMINI_API_KEY` | Your Gemini API key | Server | Optional |

4. **Click Deploy**.

5. **Configure the CPALead postback URL** (in your CPALead dashboard → Postback):
   ```
   https://YOUR-APP.vercel.app/api/cpalead-postback?subid={subid}&lead_id={lead_id}&payout={payout}&password=YOUR_POSTBACK_PASSWORD&campaign_id={campaign_id}&campaign_name={campaign_name}&country_iso={country_iso}&ip_address={ip_address}
   ```

Vercel auto-detects:
- `vercel.json` → root build config (delegates to `frontend/`)
- `api/chat.ts` → serverless function for the support bot
- `frontend/dist/` → static SPA output

---

## 📁 Repo structure

```
.
├── api/
│   └── chat.ts          ← Vercel serverless function (/api/chat)
├── frontend/            ← Vite + React SPA (the real app)
│   ├── src/             ← App.tsx, components, types, etc.
│   ├── public/
│   ├── vite.config.ts
│   └── package.json
├── package.json         ← Root build dispatcher (cd frontend && yarn build)
├── vercel.json          ← Vercel framework config
└── README.md
```

---

## 🛠 Local development

```bash
cd frontend
cp .env.example .env       # fill VITE_INSTANT_APP_ID
yarn install
yarn dev                   # → http://localhost:3000
```

The local dev server is an Express wrapper (`frontend/server.ts`) that mounts
Vite middleware and proxies `/api/chat` to the local Gemini client.
Vercel uses serverless functions instead in production.

---

## 🔐 Auth — Email OTP

Authentication uses **InstantDB's hosted email magic-codes**:
- Sign-in / register → user enters email
- InstantDB sends a 6-digit code by email (free, no SMTP setup)
- User pastes code → account looked up (sign-in) or created (register)

A **"Skip — try the demo account"** button is also available for quick previewing
without needing a real inbox.

---

## License

Apache-2.0

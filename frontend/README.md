# EarnHub

India's premier micro-tasks + CPA + 3-tier referral platform. React + Vite + InstantDB.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Database & Auth**: [InstantDB](https://www.instantdb.com) (real-time, email-OTP)
- **Serverless API**: Vercel functions (`/api/chat` for support bot)
- **AI**: Google Gemini (optional — used by support bot)
- **Icons / motion**: lucide-react, framer-motion, canvas-confetti

## Quick start (local)

```bash
cp .env.example .env
# Fill VITE_INSTANT_APP_ID at minimum

yarn install
yarn dev
# → http://localhost:3000
```

`yarn dev` boots a small Express server (`server.ts`) that mounts Vite in middleware
mode and proxies `/api/chat` to the local Gemini client. Use this for local
development only.

## Deploy to Vercel

1. **Create an InstantDB app**
   - Go to <https://www.instantdb.com/dash>
   - Copy the **App ID** — you'll need it as `VITE_INSTANT_APP_ID`
   - Email-OTP magic-codes are enabled by default on every InstantDB app
2. **(Optional) Get a Gemini API key**
   - From <https://aistudio.google.com/app/apikey>
   - Add as `GEMINI_API_KEY` for richer support-bot replies
3. **Push this folder to GitHub** (any repo)
4. **Import the repo on Vercel** (<https://vercel.com/new>)
   - Framework preset: **Vite** (auto-detected)
   - Build command: `vite build` (auto)
   - Output directory: `dist` (auto)
   - **Environment variables**:
     - `VITE_INSTANT_APP_ID` → your InstantDB app id
     - `GEMINI_API_KEY` → your Gemini key (optional)
5. **Deploy**. Vercel will:
   - Build the SPA into `dist/`
   - Auto-detect `api/chat.ts` as a serverless function
   - Apply `vercel.json` rewrites for SPA routing

That's it — no server to manage, no DB to provision.

## Auth — Email OTP via InstantDB

- **Sign in / Register** flow uses InstantDB's built-in magic-code:
  - Step 1: user enters email
  - Step 2: a 6-digit code is mailed by InstantDB (free, hosted)
  - Step 3: user enters the code; on success an account record is
    looked up (sign-in) or created (register) in the `users` collection.
- **Demo Login** button bypasses email (logs in as the seeded user `Rahul Kumar`)
  for quick previewing without a real inbox.

## Project layout

```
/api
  chat.ts            # Vercel serverless function — Gemini chat proxy
/src
  App.tsx            # Main shell, routing, auth
  components/        # Tasks, Offerwall, Wallet, Referrals, Admin, etc.
  types.ts           # Shared TS types
  index.css          # Tailwind + theme tokens
server.ts            # Local dev server (Vite middleware + chat API)
vercel.json          # Vercel framework / rewrites
vite.config.ts       # Vite config
```

## License

Apache-2.0

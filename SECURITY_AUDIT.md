# Security Audit & Hardening Report
**EarnHub — Frontend + InstantDB + Vercel serverless**

This document records the audit findings, the fixes applied, and the
deploy-time steps required to activate them. It supersedes any informal
"100% secure" copy in marketing — actual hardening is enforced by the
files listed below, not by claims.

---

## 1. Threat model

| Actor | Default trust | Capabilities |
|---|---|---|
| Anonymous web visitor | none | Hit any public marketing page |
| Authenticated end-user (InstantDB OTP) | low | Read own data; create own submissions / tickets; cannot mutate money fields |
| Authenticated admin (`role == 'admin'`) | high (server-checked) | Approve / reject all queues; suspend; broadcast |
| Server (admin SDK, `INSTANT_ADMIN_TOKEN`) | full | Bypasses all permission rules |

**Primary attack scenario closed:**
Any logged-in user opening DevTools and running
```js
db.transact([db.tx.users[myId].update({ balance: 9_999_999, points: 9_999_999 })])
```
…will now be rejected by the database itself (rule on `users.update`
requires `data.balance == newData.balance`, etc.).

---

## 2. Files added / changed

| File | Purpose |
|---|---|
| `instant.perms.ts` | **NEW.** Declarative InstantDB permission rules — default-deny on every namespace; explicit allow only for safe self-actions. |
| `api/_lib/db.ts` | **NEW.** Shared admin SDK instance (`INSTANT_ADMIN_TOKEN`). |
| `api/_lib/auth.ts` | **NEW.** Token verification + admin role check helpers. |
| `api/_lib/ids.ts` | **NEW.** Deterministic UUID helper. |
| `api/secure/checkin.ts` | **NEW.** Daily streak credit (anti double-claim). |
| `api/secure/withdraw.ts` | **NEW.** Validates balance / min / address; debits balance + creates payout. |
| `api/secure/register.ts` | **NEW.** Creates user row + sponsor bonus after OTP. |
| `api/secure/task-submit.ts` | **NEW.** Creates submission + pending tx + completed marker. |
| `api/secure/link-sponsor.ts` | **NEW.** Links a user to a sponsor (refs +1). |
| `api/secure/admin.ts` | **NEW.** Single hub for all admin actions: approve / reject proof & payout, toggle-suspend, update user, delete user, resolve ticket, broadcast, add / delete task, update settings, award reward. |
| `frontend/src/lib/secureApi.ts` | **NEW.** Browser-side wrapper that attaches the InstantDB refresh-token. |
| `frontend/src/App.tsx` | **MODIFIED.** Every balance-affecting handler now calls `secureApi.*` instead of `db.transact([...])`. Profile updates are restricted to the editable whitelist (fname, lname, mobile, upi, trc20, bep20). |

---

## 3. Permission rules cheatsheet (`instant.perms.ts`)

| Namespace | view | create | update | delete |
|---|---|---|---|---|
| **users** | signed-in | server-only | self, **money & status fields immutable** | server-only |
| tasks | signed-in | server-only | server-only | server-only |
| transactions | own only | server-only | server-only | server-only |
| submissions | own only | self, `status == 'pending'` | server-only | server-only |
| payouts | own only | server-only | server-only | server-only |
| notifications | own only | server-only | server-only | server-only |
| support_tickets | own only | self, `status == 'pending'` | server-only | server-only |
| completed_tasks | own only | self | server-only | server-only |
| Task_Ledger | own only | server-only | server-only | server-only |
| system_settings | signed-in (read) | server-only | server-only | server-only |
| systemConfig | signed-in (read) | server-only | server-only | server-only |
| cpaConversions | none (server-only audit log) | server-only | server-only | server-only |
| `$default` | **deny** | **deny** | **deny** | **deny** |

The `users.update` rule explicitly asserts:

```
data.balance         == newData.balance
data.points          == newData.points
data.totalEarned     == newData.totalEarned
data.totalWithdrawn  == newData.totalWithdrawn
data.tasksCompleted  == newData.tasksCompleted
data.refs            == newData.refs
data.suspended       == newData.suspended
data.fraudFlag       == newData.fraudFlag
data.role            == newData.role
data.refBy           == newData.refBy
data.refCode         == newData.refCode
data.email           == newData.email
data.id              == newData.id
```

Any client attempting to mutate one of these from the browser will get a
permission-denied error.

---

## 4. Frontend / backend wiring

### 4.1 Authentication flow
1. User enters email → `db.auth.sendMagicCode({ email })`
2. User enters 6-digit code → `db.auth.signInWithMagicCode({ email, code })` returns the InstantDB session including `refresh_token`.
3. App.tsx pipes that token into `secureApi.setAuthToken(...)`.
4. Every call to `/api/secure/*` carries `Authorization: Bearer <refresh_token>`.
5. The server endpoint calls `db.auth.verifyToken(token)` and then loads our row in `users` (by email). Admin endpoints additionally check `role === 'admin'`.

### 4.2 Endpoint ↔ UI map

| UI action | New backend call |
|---|---|
| Daily check-in (ProfileTab) | `POST /api/secure/checkin` |
| Withdrawal form (WalletView) | `POST /api/secure/withdraw` |
| Task submission (TaskMarketplace) | `POST /api/secure/task-submit` |
| Offerwall click | `POST /api/secure/task-submit` (uses offer id) |
| OTP signup | `POST /api/secure/register` |
| Link existing user to sponsor | `POST /api/secure/link-sponsor` |
| Admin approve / reject submission | `POST /api/secure/admin {action: 'approve-proof' \| 'reject-proof'}` |
| Admin approve / reject payout | `POST /api/secure/admin {action: 'approve-payout' \| 'reject-payout'}` |
| Admin suspend / unsuspend user | `POST /api/secure/admin {action: 'toggle-suspend'}` |
| Admin update user fields | `POST /api/secure/admin {action: 'update-user'}` |
| Admin delete user (cascade) | `POST /api/secure/admin {action: 'delete-user'}` |
| Admin resolve ticket | `POST /api/secure/admin {action: 'resolve-ticket'}` |
| Admin broadcast notification | `POST /api/secure/admin {action: 'broadcast'}` |
| Admin add / delete task | `POST /api/secure/admin {action: 'add-task' \| 'delete-task'}` |
| Admin update settings | `POST /api/secure/admin {action: 'update-settings'}` |
| Admin award manual reward | `POST /api/secure/admin {action: 'award-reward'}` |
| CPALead conversion webhook | `GET /api/cpalead-postback` (already server-only, shared-secret) |

### 4.3 What is still allowed directly from the client

These are the ONLY client-initiated `db.transact()` writes that remain
in `App.tsx`. They are intentionally permitted by `instant.perms.ts`:

* `users[self].update({ fname, lname, mobile, upi, trc20, bep20 })` — profile fields only.
* `support_tickets[newId].update({ ... status: 'pending', userId: self })` — open a ticket.
* `notifications[id].delete()` — dismiss own notification.

Everything else routes through `/api/secure/*`.

---

## 5. Referral tree validation

The referral cascade now lives in **one place** — `api/secure/admin.ts`,
`approve-proof` action. It walks `user.refBy → sponsor.refBy → ...` for
**at most 3 hops** (L1 10 %, L2 5 %, L3 2 %), looking up each sponsor by
`refCode` and crediting them transactionally.

Bidirectional integrity checks performed:

* `users.refCode` is **immutable** from the client (rule).
* `users.refBy` is **immutable** from the client (rule). It is set
  exactly once: either by `/api/secure/register` (at signup) or by
  `/api/secure/link-sponsor` (one-time, refuses if already linked, blocks
  self-referral, blocks suspended sponsors).
* On `register`, `sponsor.refs` is incremented by **the server in the
  same transaction** that creates the new user — no orphan or partial
  states possible.
* Referral display on the user side (`App.tsx`, `referrals` memo)
  iterates the live `dbUsers` list filtered by `refBy === me.refCode`
  for L1, then `refBy ∈ {L1.refCode}` for L2, then `refBy ∈ {L2.refCode}`
  for L3 — pure derived state, no separate "referrals" table to drift
  out of sync.

**No data inversion possible**: there is no place where `sponsor` and
`child` UIDs could be swapped because all writes use the same convention
— `data.refBy == sponsor.refCode`.

---

## 6. Types ↔ DB schema audit

`frontend/src/types.ts` was cross-referenced against every field
written by the new server endpoints and the existing CPALead postback.
**No mismatches** — all fields present in the runtime documents map to
an interface field. Notes:

* `User.pass` is kept as a no-op `''` for backward compatibility but is
  never read or written by the OTP flow; safe to remove in a future cleanup.
* `Transaction.userId` is now always populated (was optional). The type
  remains `userId?: string` to keep older seed data parsable.
* `WithdrawRequest.status` only takes values `'pending' | 'approved' | 'rejected'` — matches the union in `types.ts`.
* `SupportTicket.status` only takes values `'pending' | 'resolved'` — matches.

---

## 7. Deploy checklist

To activate the new defences in production:

1. **Push the permission rules to InstantDB** (must run once and after
   every edit to `instant.perms.ts`):
   ```bash
   npx instant-cli@latest push perms
   ```
   You will need `INSTANT_ADMIN_TOKEN` in your shell environment for
   this command.
2. **Add server-side environment variables on Vercel**
   (Settings → Environment Variables):
   - `INSTANT_APP_ID` — your InstantDB app ID
   - `INSTANT_ADMIN_TOKEN` — admin token from InstantDB dashboard
   - (existing) `CPALEAD_POSTBACK_PASSWORD`, `CPALEAD_PUBLISHER_ID`, etc.
3. **Re-deploy**. Vercel auto-detects every file under `/api/` —
   no extra `functions` config required for the new `/api/secure/*`.
4. Smoke-test as a non-admin user:
   - Try `db.transact([db.tx.users[me].update({ balance: 1 })])` from
     DevTools → should be **rejected**.
   - Daily check-in / withdraw / task submit → should still work via
     the new endpoints.
5. Smoke-test as an admin user:
   - Approve a submission → user balance & sponsor commission credited.

---

## 8. Known limitations & follow-ups

* **InstantDB CEL syntax for compound boolean expressions** — the rules
  use string-concatenated AND clauses. If InstantDB rejects the
  combined string at `push perms`, split each clause into its own
  `bind:` helper. The semantics are unchanged.
* **Demo login** (`handleDemoLogin`) bypasses InstantDB OTP and grabs
  the seeded user from the local cache. This still works for
  client-side navigation but the demo user has **no `refresh_token`**,
  so any action that flows through `secureApi` will fail with
  "You are not signed in." Document this in the UI or remove the demo
  button in production.
* **Seed data** must be inserted via the admin SDK / dashboard. The
  legacy "auto-seed on first render" code in App.tsx now silently no-ops
  under the new rules. Provide an admin-only `/api/secure/seed` if you
  need a one-click first-run option.

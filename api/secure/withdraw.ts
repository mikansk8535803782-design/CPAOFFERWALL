// POST /api/secure/withdraw
// Server-side withdrawal request. Validates balance and minimum threshold,
// debits balance, records a payout + transaction, and notifies the user.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_lib/db';
import { requireUser, authErrorStatus } from '../_lib/auth';
import { newId, today } from '../_lib/ids';

const ALLOWED_METHODS = ['UPI', 'USDT TRC20', 'USDT BEP20'] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  let user;
  try {
    user = await requireUser(req);
  } catch (e: any) {
    const err = authErrorStatus(e?.message || '');
    return res.status(err.status).json(err.body);
  }

  const body = (req.body || {}) as { amount?: number; method?: string; dest?: string };
  const amount = Number(body.amount);
  const method = String(body.method || '').trim();
  const dest = String(body.dest || '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'invalid amount' });
  }
  if (!ALLOWED_METHODS.includes(method as any)) {
    return res.status(400).json({ error: 'invalid method' });
  }
  if (!dest || dest.length < 4) {
    return res.status(400).json({ error: 'invalid destination' });
  }

  // Load latest system settings to enforce the minimum-withdrawal floor.
  const db = getAdminDb();
  const sQ = await db.query({ system_settings: {} });
  const settings = (sQ.system_settings?.[0] || {}) as any;
  const minWithdrawal = Number(settings.minWithdrawal ?? 100);

  if (amount < minWithdrawal) {
    return res.status(400).json({ error: `minimum withdrawal is ₹${minWithdrawal}` });
  }
  if (amount > (user.balance || 0)) {
    return res.status(400).json({ error: 'insufficient balance' });
  }

  // Format-specific validation
  if (method === 'USDT TRC20') {
    if (dest.length !== 34 || !dest.startsWith('T')) {
      return res.status(400).json({ error: 'TRC20 address must be 34 chars and start with T' });
    }
  } else if (method === 'USDT BEP20') {
    if (dest.length !== 42 || !dest.startsWith('0x')) {
      return res.status(400).json({ error: 'BEP20 address must be 42 chars and start with 0x' });
    }
  }

  const reqId = newId('WD');
  const dateStr = today();

  await db.transact([
    db.tx.users[user.id].update({
      balance: +(((user.balance || 0) - amount).toFixed(2)),
      totalWithdrawn: +(((user.totalWithdrawn || 0) + amount).toFixed(2)),
    }),
    db.tx.transactions[reqId].update({
      id: reqId,
      desc: `${method} Withdrawal request to: ${dest}`,
      type: 'withdraw',
      amount: -amount,
      pts: 0,
      status: 'pending',
      date: dateStr,
      dir: -1,
      userId: user.id,
    }),
    db.tx.transactions[reqId].link({ user: user.id }),
    db.tx.payouts[reqId].update({
      id: reqId,
      userId: user.id,
      userName: `${user.fname} ${user.lname}`,
      method,
      dest,
      amount,
      status: 'pending',
      date: dateStr,
    }),
    db.tx.payouts[reqId].link({ user: user.id }),
  ]);

  return res.status(200).json({ ok: true, requestId: reqId });
}

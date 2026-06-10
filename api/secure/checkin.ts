// POST /api/secure/checkin
// Server-side daily streak check-in. Awards 100 pts + ₹1 once per UTC day.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_lib/db';
import { requireUser, authErrorStatus } from '../_lib/auth';
import { newId, today } from '../_lib/ids';

const CHECKIN_PTS = 100;
const CHECKIN_INR = 1;

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

  // Anti double-claim: if last check-in is today, refuse.
  if (user.lastCheckIn) {
    const last = new Date(user.lastCheckIn).toDateString();
    const now = new Date().toDateString();
    if (last === now) {
      return res.status(409).json({ error: 'already claimed today' });
    }
  }

  const newStreak = (user.streakCount || 0) + 1;
  const db = getAdminDb();
  const txId = newId('TXN_CHECKIN');

  await db.transact([
    db.tx.users[user.id].update({
      balance: +(((user.balance || 0) + CHECKIN_INR).toFixed(2)),
      points: (user.points || 0) + CHECKIN_PTS,
      totalEarned: +(((user.totalEarned || 0) + CHECKIN_INR).toFixed(2)),
      lastCheckIn: new Date().toISOString(),
      streakCount: newStreak,
    }),
    db.tx.transactions[txId].update({
      id: txId,
      desc: `Daily Streak Check-in (Day ${newStreak})`,
      type: 'task',
      amount: CHECKIN_INR,
      pts: CHECKIN_PTS,
      status: 'approved',
      date: today(),
      dir: 1,
      userId: user.id,
    }),
    db.tx.transactions[txId].link({ user: user.id }),
  ]);

  return res.status(200).json({
    ok: true,
    streak: newStreak,
    creditedPts: CHECKIN_PTS,
    creditedInr: CHECKIN_INR,
  });
}

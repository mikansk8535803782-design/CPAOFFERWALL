// POST /api/secure/register
// Server-side user registration. The caller has already passed InstantDB
// email-OTP, so we trust the bearer token. We then create the matching
// row in our `users` namespace and credit the referral bonus.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_lib/db';
import { newId, toDocId, today } from '../_lib/ids';

const SIGNUP_BONUS_PTS = 50;
const SIGNUP_BONUS_INR = 2.5;
const REF_BONUS_PTS = 200;
const REF_BONUS_INR = 10;

function readBearer(req: VercelRequest): string | null {
  const raw = req.headers.authorization || req.headers.Authorization;
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const token = readBearer(req);
  if (!token) return res.status(401).json({ error: 'unauthenticated' });

  const db = getAdminDb();
  let authUser: any;
  try {
    authUser = await db.auth.verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
  if (!authUser?.email) return res.status(401).json({ error: 'invalid token' });

  const body = (req.body || {}) as {
    fname?: string; lname?: string; mobile?: string; refBy?: string | null;
  };
  const fname = String(body.fname || '').trim();
  const lname = String(body.lname || 'User').trim();
  const mobile = String(body.mobile || '').trim();
  const refByRaw = body.refBy ? String(body.refBy).trim().toUpperCase() : null;
  const email = String(authUser.email).toLowerCase();

  if (!fname) return res.status(400).json({ error: 'fname required' });
  if (!mobile || mobile.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ error: 'invalid mobile' });
  }

  // Reject duplicate email/mobile
  const dupQ = await db.query({
    users: { $: { where: { or: [{ email }, { mobile }] } } },
  });
  if ((dupQ.users || []).length > 0) {
    return res.status(409).json({ error: 'email or mobile already registered' });
  }

  // Validate referrer
  let refBy: string | null = null;
  let sponsor: any = null;
  if (refByRaw) {
    const refQ = await db.query({ users: { $: { where: { refCode: refByRaw } } } });
    sponsor = refQ.users?.[0];
    if (!sponsor) return res.status(400).json({ error: 'invalid referral code' });
    if (sponsor.suspended) return res.status(400).json({ error: 'referral sponsor suspended' });
    refBy = refByRaw;
  }

  // Build new user
  let refCode = 'USR' + Math.floor(1001 + Math.random() * 8999);
  // Ensure unique refCode
  for (let i = 0; i < 5; i++) {
    const q = await db.query({ users: { $: { where: { refCode } } } });
    if (!(q.users || []).length) break;
    refCode = 'USR' + Math.floor(1001 + Math.random() * 8999);
  }
  const userId = toDocId(`new_${refCode}_${Date.now()}`);

  const newUser = {
    id: userId,
    fname,
    lname,
    email,
    pass: '',
    mobile,
    role: 'user' as const,
    points: SIGNUP_BONUS_PTS,
    balance: SIGNUP_BONUS_INR,
    totalEarned: SIGNUP_BONUS_INR,
    totalWithdrawn: 0,
    tasksCompleted: 0,
    refs: 0,
    suspended: false,
    regDate: today(),
    refCode,
    refBy,
  };

  const txs: any[] = [db.tx.users[userId].update(newUser)];

  if (sponsor) {
    txs.push(db.tx.users[sponsor.id].update({
      refs: (sponsor.refs || 0) + 1,
      points: (sponsor.points || 0) + REF_BONUS_PTS,
      balance: +(((sponsor.balance || 0) + REF_BONUS_INR).toFixed(2)),
      totalEarned: +(((sponsor.totalEarned || 0) + REF_BONUS_INR).toFixed(2)),
    }));
    const bonusTxId = newId('TXN_REF_BONUS');
    txs.push(db.tx.transactions[bonusTxId].update({
      id: bonusTxId,
      desc: `Referral signup bonus: @${fname}`,
      type: 'referral',
      amount: REF_BONUS_INR,
      pts: REF_BONUS_PTS,
      status: 'approved',
      date: today(),
      dir: 1,
      userId: sponsor.id,
    }));
    txs.push(db.tx.transactions[bonusTxId].link({ user: sponsor.id }));
    const notifId = newId('NFT_REF_BONUS');
    txs.push(db.tx.notifications[notifId].update({
      id: notifId,
      icon: '🤝',
      msg: `Your referral @${fname} just joined. +₹${REF_BONUS_INR.toFixed(2)} credited.`,
      time: 'Just now',
      userId: sponsor.id,
    }));
    txs.push(db.tx.notifications[notifId].link({ user: sponsor.id }));
  }

  await db.transact(txs);
  return res.status(200).json({ ok: true, user: newUser });
}

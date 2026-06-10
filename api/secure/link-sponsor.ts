// POST /api/secure/link-sponsor
// Allows a user with no existing sponsor to link themselves to a referral
// code. Only adjusts refs/refBy — no balance change.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_lib/db';
import { requireUser, authErrorStatus } from '../_lib/auth';

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

  if (user.refBy) {
    return res.status(409).json({ error: 'already linked to a sponsor' });
  }

  const body = (req.body || {}) as { sponsorCode?: string };
  const code = String(body.sponsorCode || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ error: 'sponsorCode required' });
  if (code === user.refCode) {
    return res.status(400).json({ error: 'cannot self-refer' });
  }

  const db = getAdminDb();
  const q = await db.query({ users: { $: { where: { refCode: code } } } });
  const sponsor = q.users?.[0] as any;
  if (!sponsor) return res.status(404).json({ error: 'sponsor not found' });
  if (sponsor.suspended) return res.status(400).json({ error: 'sponsor suspended' });

  await db.transact([
    db.tx.users[user.id].update({ refBy: code }),
    db.tx.users[sponsor.id].update({ refs: (sponsor.refs || 0) + 1 }),
  ]);
  return res.status(200).json({ ok: true });
}

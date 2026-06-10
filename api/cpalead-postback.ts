// Vercel serverless function — GET/POST /api/cpalead-postback
// Receives conversion notifications from CPALead and credits the user
// inside InstantDB via the admin SDK, in a single atomic transaction.
//
// Security:
//   1. Shared-secret `password` parameter (CPALEAD_POSTBACK_PASSWORD)
//      verified with constant-time comparison.
//   2. `lead_id` is used as the cpaConversions document key, so any
//      duplicate retry from CPALead's queue is silently a no-op.
//   3. The InstantDB admin token is server-only — never exposed to the
//      browser bundle.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { init, tx, id as instaId } from '@instantdb/admin';
import crypto from 'crypto';

// ── Helpers ──────────────────────────────────────────────────────────────

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a || '', 'utf8');
  const bufB = Buffer.from(b || '', 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Encode any string into a deterministic UUID v5-like value usable as an
 *  InstantDB document key. We mirror the toUUID(...) helper from the client
 *  app so leadId → cpaConversions doc id stays stable across retries. */
function toDocId(seed: string): string {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32),
  ].join('-');
}

function readParam(req: VercelRequest, key: string): string {
  const q = req.query?.[key];
  const b = (req.body && typeof req.body === 'object') ? (req.body as any)[key] : undefined;
  const v = q ?? b ?? '';
  return Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
}

// ── Lazy InstantDB admin client (per-runtime singleton) ──────────────────

let dbInstance: ReturnType<typeof init> | null = null;
function getDb() {
  if (dbInstance) return dbInstance;
  const appId = process.env.INSTANT_APP_ID || process.env.VITE_INSTANT_APP_ID;
  const adminToken = process.env.INSTANT_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    throw new Error('InstantDB admin SDK not configured: INSTANT_APP_ID / INSTANT_ADMIN_TOKEN missing.');
  }
  dbInstance = init({ appId, adminToken });
  return dbInstance;
}

// ── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).send('Method not allowed');
  }

  // 1. Shared-secret password verification
  const expectedPassword = process.env.CPALEAD_POSTBACK_PASSWORD || '';
  const incomingPassword = readParam(req, 'password');
  if (!expectedPassword) {
    console.error('CPALEAD_POSTBACK_PASSWORD env not set — refusing all postbacks.');
    return res.status(500).send('server misconfigured');
  }
  if (!constantTimeEqual(incomingPassword, expectedPassword)) {
    return res.status(401).send('invalid password');
  }

  // 2. Extract & validate CPALead payload
  const leadId = readParam(req, 'lead_id');
  const subid = readParam(req, 'subid');
  const payoutStr = readParam(req, 'payout');
  if (!leadId || !subid || !payoutStr) {
    return res.status(400).send('missing required fields: lead_id, subid, payout');
  }
  const payoutUsd = parseFloat(payoutStr);
  if (!Number.isFinite(payoutUsd) || payoutUsd < 0) {
    return res.status(400).send('invalid payout');
  }

  const campaignId = readParam(req, 'campaign_id');
  const campaignName = readParam(req, 'campaign_name') || 'CPALead Offer';
  const offerId = readParam(req, 'offer_id') || campaignId;
  const countryIso = (readParam(req, 'country_iso') || 'IN').toUpperCase();
  const ipAddress = readParam(req, 'ip_address')
    || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || '';

  let db;
  try {
    db = getDb();
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message || 'db unavailable');
  }

  // 3. Idempotency check — has this lead_id already been processed?
  const conversionDocId = toDocId(`cpa_lead_${leadId}`);
  const dupCheck = await db.query({
    cpaConversions: { $: { where: { leadId } } },
  });
  if (dupCheck.cpaConversions && dupCheck.cpaConversions.length > 0) {
    return res.status(200).send('duplicate — already processed');
  }

  // 4. Find the user by subid (= user.id) — try both raw and tolerant lookups
  const userQuery = await db.query({
    users: { $: { where: { id: subid } } },
  });
  const user = userQuery.users?.[0];
  if (!user) {
    // Still log the conversion so admins can investigate
    await db.transact([
      tx.cpaConversions[conversionDocId].update({
        id: conversionDocId,
        leadId,
        userId: subid,
        userName: 'UNKNOWN',
        offerId,
        campaignId,
        campaignName,
        payoutUsd,
        payoutInr: 0,
        pointsCredited: 0,
        countryIso,
        ipAddress,
        rawPayload: JSON.stringify({ query: req.query, body: req.body }),
        createdAt: new Date().toISOString(),
      }),
    ]);
    return res.status(200).send('user not found — conversion logged for review');
  }
  if ((user as any).suspended) {
    return res.status(200).send('user suspended — no credit issued');
  }

  // 5. Pull current system settings (payout ratio, USD→INR, pts rate)
  const settingsQuery = await db.query({ system_settings: {} });
  const settings = (settingsQuery.system_settings?.[0] || {}) as any;
  const ratio = Number.isFinite(settings.cpaPayoutRatio) ? settings.cpaPayoutRatio : 0.7;
  const usdInr = Number.isFinite(settings.cpaUsdToInr) ? settings.cpaUsdToInr : 83;
  const ptsRate = Number.isFinite(settings.ptsToCashRate) ? settings.ptsToCashRate : 20;

  // 6. Compute reward
  const payoutInr = +(payoutUsd * usdInr * ratio).toFixed(2);
  const pointsCredited = Math.max(0, Math.round(payoutInr * ptsRate));

  // 7. Single atomic write — conversion + balance + tx + notification
  const now = new Date();
  const isoNow = now.toISOString();
  const dateStr = isoNow.split('T')[0];
  const txDocId = toDocId(`cpa_tx_${leadId}`);
  const notifDocId = toDocId(`cpa_notif_${leadId}`);

  await db.transact([
    tx.cpaConversions[conversionDocId].update({
      id: conversionDocId,
      leadId,
      userId: user.id,
      userName: `${(user as any).fname || ''} ${(user as any).lname || ''}`.trim() || 'User',
      offerId,
      campaignId,
      campaignName,
      payoutUsd,
      payoutInr,
      pointsCredited,
      countryIso,
      ipAddress,
      rawPayload: JSON.stringify({ query: req.query, body: req.body }),
      createdAt: isoNow,
    }),
    tx.users[user.id].update({
      points: ((user as any).points || 0) + pointsCredited,
      balance: +(((user as any).balance || 0) + payoutInr).toFixed(2),
      totalEarned: +(((user as any).totalEarned || 0) + payoutInr).toFixed(2),
      tasksCompleted: ((user as any).tasksCompleted || 0) + 1,
    }),
    tx.transactions[txDocId].update({
      id: txDocId,
      desc: `CPA offer: ${campaignName}`,
      type: 'cpa',
      amount: payoutInr,
      pts: pointsCredited,
      status: 'approved',
      date: dateStr,
      dir: 1,
      userId: user.id,
    }),
    tx.transactions[txDocId].link({ user: user.id }),
    tx.notifications[notifDocId].update({
      id: notifDocId,
      icon: '💰',
      msg: `CPA offer "${campaignName}" completed — +₹${payoutInr.toFixed(2)} credited.`,
      time: 'Just now',
      userId: user.id,
    }),
    tx.notifications[notifDocId].link({ user: user.id }),
  ]);

  return res.status(200).send(`OK lead=${leadId} pts=${pointsCredited} inr=${payoutInr}`);
}

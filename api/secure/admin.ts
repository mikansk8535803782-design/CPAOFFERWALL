// POST /api/secure/admin
// Single admin action hub. Body: { action: string, payload: {...} }
// All sensitive mutations (rewards, balance adjustments, suspensions,
// settings, deletes) go through this endpoint after admin verification.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_lib/db';
import { requireAdmin, authErrorStatus } from '../_lib/auth';
import { newId, today } from '../_lib/ids';

type AnyTx = any;

async function findUserById(db: ReturnType<typeof getAdminDb>, userId: string) {
  const q = await db.query({ users: { $: { where: { id: userId } } } });
  return q.users?.[0] as any;
}

// ─── action handlers ──────────────────────────────────────────────────────
const ACTIONS = {
  // ── Proof / task submission queue ────────────────────────────────────
  async 'approve-proof'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { submissionId } = payload || {};
    if (!submissionId) throw new Error('submissionId required');

    const sQ = await db.query({ submissions: { $: { where: { id: submissionId } } } });
    const sub = sQ.submissions?.[0] as any;
    if (!sub) throw new Error('submission not found');
    if (sub.status !== 'pending') throw new Error('already processed');

    const tQ = await db.query({ tasks: { $: { where: { id: sub.taskId } } } });
    const task = tQ.tasks?.[0] as any;
    if (!task) throw new Error('task not found');

    const user = await findUserById(db, sub.userId);
    if (!user) throw new Error('user not found');

    const settingsQ = await db.query({ system_settings: {} });
    const settings = (settingsQ.system_settings?.[0] || {}) as any;
    const multiplier = Number(settings.vipMultiplier ?? 1);
    const rewardPts = Math.round((task.pts || 0) * multiplier);
    const rewardInr = +(((task.value || 0)).toFixed(2));

    const txs: AnyTx[] = [
      db.tx.users[user.id].update({
        balance: +(((user.balance || 0) + rewardInr).toFixed(2)),
        points: (user.points || 0) + rewardPts,
        totalEarned: +(((user.totalEarned || 0) + rewardInr).toFixed(2)),
        tasksCompleted: (user.tasksCompleted || 0) + 1,
      }),
      db.tx.submissions[submissionId].update({ status: 'approved' }),
    ];

    // Find any pending placeholder transaction for this task and finalize it.
    const txQ = await db.query({
      transactions: { $: { where: { taskId: sub.taskId, userId: user.id, status: 'pending' } } },
    });
    const pendingTx = txQ.transactions?.[0] as any;
    if (pendingTx) {
      txs.push(db.tx.transactions[pendingTx.id].update({
        status: 'approved',
        amount: rewardInr,
        pts: rewardPts,
        desc: task.title,
      }));
    } else {
      const txId = newId('TXN_TASK');
      txs.push(db.tx.transactions[txId].update({
        id: txId,
        desc: task.title,
        type: 'task',
        amount: rewardInr,
        pts: rewardPts,
        status: 'approved',
        date: today(),
        dir: 1,
        userId: user.id,
        taskId: sub.taskId,
      }));
      txs.push(db.tx.transactions[txId].link({ user: user.id }));
    }

    // ── Qualified-referral one-time bonus ─────────────────────────────
    // When the referred user crosses 2 verified tasks, credit their direct
    // sponsor with a flat ₹15 + 300 pts. Pays exactly once per user.
    const newTaskCount = (user.tasksCompleted || 0) + 1;
    if (
      user.refBy &&
      !user.refRewardPaid &&
      newTaskCount >= 2
    ) {
      const sQ3 = await db.query({ users: { $: { where: { refCode: user.refBy } } } });
      const directSponsor = sQ3.users?.[0] as any;
      if (directSponsor && !directSponsor.suspended) {
        const refInr = 15;
        const refPts = 300;
        const refTxId = newId('TXN_REF_BONUS');
        const refNotifId = newId('NFT_REF_BONUS');
        txs.push(db.tx.users[directSponsor.id].update({
          balance: +(((directSponsor.balance || 0) + refInr).toFixed(2)),
          points: (directSponsor.points || 0) + refPts,
          totalEarned: +(((directSponsor.totalEarned || 0) + refInr).toFixed(2)),
        }));
        txs.push(db.tx.users[user.id].update({ refRewardPaid: true }));
        txs.push(db.tx.transactions[refTxId].update({
          id: refTxId,
          desc: `Qualified referral bonus: @${user.fname} (2 tasks completed)`,
          type: 'referral',
          amount: refInr,
          pts: refPts,
          status: 'approved',
          date: today(),
          dir: 1,
          userId: directSponsor.id,
        }));
        txs.push(db.tx.transactions[refTxId].link({ user: directSponsor.id }));
        txs.push(db.tx.notifications[refNotifId].update({
          id: refNotifId,
          icon: '🎯',
          msg: `Referral qualified! @${user.fname} completed 2 tasks. +₹${refInr.toFixed(2)} credited.`,
          time: 'Just now',
          userId: directSponsor.id,
        }));
        txs.push(db.tx.notifications[refNotifId].link({ user: directSponsor.id }));
      }
    }

    // 3-tier commission cascade (10 / 5 / 2 %) — runs every task
    if (user.refBy) {
      const levels = [0.10, 0.05, 0.02];
      let sponsorCode = user.refBy;
      for (let lvl = 0; lvl < levels.length && sponsorCode; lvl++) {
        const sQ2 = await db.query({ users: { $: { where: { refCode: sponsorCode } } } });
        const sponsor = sQ2.users?.[0] as any;
        if (!sponsor) break;
        const commInr = +(rewardInr * levels[lvl]).toFixed(2);
        if (commInr > 0) {
          const commPts = Math.round(commInr * Number(settings.ptsToCashRate ?? 20));
          const commTxId = newId(`TXN_COMM_${lvl}`);
          txs.push(db.tx.users[sponsor.id].update({
            balance: +(((sponsor.balance || 0) + commInr).toFixed(2)),
            points: (sponsor.points || 0) + commPts,
            totalEarned: +(((sponsor.totalEarned || 0) + commInr).toFixed(2)),
          }));
          txs.push(db.tx.transactions[commTxId].update({
            id: commTxId,
            desc: `L${lvl + 1} Commission from @${user.fname}`,
            type: 'referral',
            amount: commInr,
            pts: commPts,
            status: 'approved',
            date: today(),
            dir: 1,
            userId: sponsor.id,
          }));
          txs.push(db.tx.transactions[commTxId].link({ user: sponsor.id }));
        }
        sponsorCode = sponsor.refBy || '';
      }
    }

    await db.transact(txs);
    return { ok: true, rewardPts, rewardInr };
  },

  async 'reject-proof'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { submissionId } = payload || {};
    if (!submissionId) throw new Error('submissionId required');
    const sQ = await db.query({ submissions: { $: { where: { id: submissionId } } } });
    const sub = sQ.submissions?.[0] as any;
    if (!sub) throw new Error('submission not found');

    const txs: AnyTx[] = [db.tx.submissions[submissionId].update({ status: 'rejected' })];
    const txQ = await db.query({
      transactions: { $: { where: { taskId: sub.taskId, userId: sub.userId, status: 'pending' } } },
    });
    const pendingTx = txQ.transactions?.[0] as any;
    if (pendingTx) {
      txs.push(db.tx.transactions[pendingTx.id].update({
        status: 'rejected',
        desc: `${(pendingTx.desc || '').replace(' (Verification Pending)', '')} (Rejected)`,
      }));
    }
    await db.transact(txs);
    return { ok: true };
  },

  // ── Payout queue ────────────────────────────────────────────────────
  async 'approve-payout'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { payoutId } = payload || {};
    if (!payoutId) throw new Error('payoutId required');
    const pQ = await db.query({ payouts: { $: { where: { id: payoutId } } } });
    const p = pQ.payouts?.[0] as any;
    if (!p) throw new Error('payout not found');
    if (p.status !== 'pending') throw new Error('already processed');

    const notifId = newId('NFT_PAY_APR');
    await db.transact([
      db.tx.payouts[payoutId].update({ status: 'approved' }),
      db.tx.notifications[notifId].update({
        id: notifId,
        icon: '💸',
        msg: `Your withdrawal of ₹${Number(p.amount).toFixed(2)} via ${p.method} was approved.`,
        time: 'Just now',
        userId: p.userId,
      }),
      db.tx.notifications[notifId].link({ user: p.userId }),
    ]);
    return { ok: true };
  },

  async 'reject-payout'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { payoutId } = payload || {};
    if (!payoutId) throw new Error('payoutId required');
    const pQ = await db.query({ payouts: { $: { where: { id: payoutId } } } });
    const p = pQ.payouts?.[0] as any;
    if (!p) throw new Error('payout not found');
    if (p.status !== 'pending') throw new Error('already processed');

    const user = await findUserById(db, p.userId);
    if (!user) throw new Error('user not found');

    const settingsQ = await db.query({ system_settings: {} });
    const settings = (settingsQ.system_settings?.[0] || {}) as any;
    const ptsRate = Number(settings.ptsToCashRate ?? 20);
    const refundInr = Number(p.amount);
    const refundPts = Math.round(refundInr * ptsRate);

    const txId = newId('TXN_REFUND');
    const notifId = newId('NFT_PAY_REJ');

    await db.transact([
      db.tx.users[user.id].update({
        balance: +(((user.balance || 0) + refundInr).toFixed(2)),
        points: (user.points || 0) + refundPts,
        totalWithdrawn: +(((user.totalWithdrawn || 0) - refundInr).toFixed(2)),
      }),
      db.tx.payouts[payoutId].update({ status: 'rejected' }),
      db.tx.transactions[txId].update({
        id: txId,
        desc: `Refund for rejected withdrawal #${payoutId.slice(0, 8)}`,
        type: 'withdraw',
        amount: refundInr,
        pts: refundPts,
        status: 'approved',
        date: today(),
        dir: 1,
        userId: user.id,
      }),
      db.tx.transactions[txId].link({ user: user.id }),
      db.tx.notifications[notifId].update({
        id: notifId,
        icon: '❌',
        msg: `Your withdrawal of ₹${refundInr.toFixed(2)} was rejected. Funds refunded.`,
        time: 'Just now',
        userId: user.id,
      }),
      db.tx.notifications[notifId].link({ user: user.id }),
    ]);
    return { ok: true };
  },

  // ── User admin ──────────────────────────────────────────────────────
  async 'toggle-suspend'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { userId } = payload || {};
    if (!userId) throw new Error('userId required');
    const u = await findUserById(db, userId);
    if (!u) throw new Error('user not found');
    await db.transact([db.tx.users[userId].update({ suspended: !u.suspended })]);
    return { ok: true, suspended: !u.suspended };
  },

  async 'update-user'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { userId, fields } = payload || {};
    if (!userId || !fields || typeof fields !== 'object') throw new Error('userId and fields required');
    // Whitelist of admin-mutable fields
    const allowed = [
      'fname', 'lname', 'mobile', 'role', 'balance', 'points', 'totalEarned',
      'totalWithdrawn', 'tasksCompleted', 'refs', 'suspended', 'fraudFlag',
      'upi', 'trc20', 'bep20', 'refBy',
    ];
    const safe: any = {};
    for (const k of allowed) {
      if (k in fields) safe[k] = fields[k];
    }
    if (Object.keys(safe).length === 0) throw new Error('no allowed fields to update');
    await db.transact([db.tx.users[userId].update(safe)]);
    return { ok: true };
  },

  async 'delete-user'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { userId } = payload || {};
    if (!userId) throw new Error('userId required');

    const runs: AnyTx[] = [];
    // Cascade delete linked rows. Use parallel queries.
    const [txQ, sQ, pQ, nQ, tkQ, ctQ, tlQ] = await Promise.all([
      db.query({ transactions: { $: { where: { userId } } } }),
      db.query({ submissions: { $: { where: { userId } } } }),
      db.query({ payouts: { $: { where: { userId } } } }),
      db.query({ notifications: { $: { where: { userId } } } }),
      db.query({ support_tickets: { $: { where: { userId } } } }),
      db.query({ completed_tasks: { $: { where: { userId } } } }),
      db.query({ Task_Ledger: { $: { where: { userId } } } }),
    ]);
    (txQ.transactions || []).forEach((r: any) => runs.push(db.tx.transactions[r.id].delete()));
    (sQ.submissions || []).forEach((r: any) => runs.push(db.tx.submissions[r.id].delete()));
    (pQ.payouts || []).forEach((r: any) => runs.push(db.tx.payouts[r.id].delete()));
    (nQ.notifications || []).forEach((r: any) => runs.push(db.tx.notifications[r.id].delete()));
    (tkQ.support_tickets || []).forEach((r: any) => runs.push(db.tx.support_tickets[r.id].delete()));
    (ctQ.completed_tasks || []).forEach((r: any) => runs.push(db.tx.completed_tasks[r.id].delete()));
    (tlQ.Task_Ledger || []).forEach((r: any) => runs.push(db.tx.Task_Ledger[r.id].delete()));
    runs.push(db.tx.users[userId].delete());
    await db.transact(runs);
    return { ok: true, deleted: runs.length };
  },

  // ── Tickets / notifications ─────────────────────────────────────────
  async 'resolve-ticket'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { ticketId, reply } = payload || {};
    if (!ticketId) throw new Error('ticketId required');
    const q = await db.query({ support_tickets: { $: { where: { id: ticketId } } } });
    const tkt = q.support_tickets?.[0] as any;
    if (!tkt) throw new Error('ticket not found');
    const notifId = newId('NFT_TKT');
    await db.transact([
      db.tx.support_tickets[ticketId].update({ status: 'resolved', reply: reply || '' }),
      db.tx.notifications[notifId].update({
        id: notifId,
        icon: '💬',
        msg: `Support reply: "${reply || 'Your ticket has been resolved.'}"`,
        time: 'Just now',
        userId: tkt.userId,
      }),
      db.tx.notifications[notifId].link({ user: tkt.userId }),
    ]);
    return { ok: true };
  },

  async 'broadcast'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { message, mediaUrl, mediaType, linkUrl, icon } = payload || {};
    if (!message) throw new Error('message required');

    // Server-side validation of the optional media URL
    let safeMediaUrl = '';
    let safeMediaType: 'image' | 'video' | '' = '';
    if (mediaUrl) {
      const u = String(mediaUrl).trim();
      if (!/^https?:\/\//i.test(u) && !u.startsWith('data:image/')) {
        throw new Error('mediaUrl must start with http(s):// or be a data:image URL');
      }
      if (u.length > 200_000) throw new Error('mediaUrl too large (max 200KB)');
      safeMediaUrl = u;
      // Resolve type from explicit value or guess from extension
      if (mediaType === 'image' || mediaType === 'video') {
        safeMediaType = mediaType;
      } else if (/\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?|$)/i.test(u) || u.startsWith('data:image/')) {
        safeMediaType = 'image';
      } else if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(u) || /youtube|youtu\.be|vimeo/i.test(u)) {
        safeMediaType = 'video';
      } else {
        safeMediaType = 'image';
      }
    }
    let safeLinkUrl = '';
    if (linkUrl) {
      const lu = String(linkUrl).trim();
      if (!/^https?:\/\//i.test(lu)) throw new Error('linkUrl must start with http(s)://');
      safeLinkUrl = lu;
    }
    const safeIcon = (icon && typeof icon === 'string') ? icon.slice(0, 8) : '📢';

    const q = await db.query({ users: {} });
    const runs: AnyTx[] = [];
    (q.users || []).forEach((u: any) => {
      const notifId = newId(`NFT_BC_${u.id}`);
      const row: any = {
        id: notifId,
        icon: safeIcon,
        msg: message,
        time: 'Just now',
        userId: u.id,
      };
      if (safeMediaUrl) {
        row.mediaUrl = safeMediaUrl;
        row.mediaType = safeMediaType;
      }
      if (safeLinkUrl) row.linkUrl = safeLinkUrl;
      runs.push(db.tx.notifications[notifId].update(row));
      runs.push(db.tx.notifications[notifId].link({ user: u.id }));
    });
    if (runs.length) await db.transact(runs);
    return { ok: true, delivered: runs.length / 2 };
  },

  // ── Tasks & settings ────────────────────────────────────────────────
  async 'add-task'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { task } = payload || {};
    if (!task?.id || !task?.title) throw new Error('task.id and title required');
    await db.transact([db.tx.tasks[task.id].update(task)]);
    return { ok: true };
  },

  async 'delete-task'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { taskId } = payload || {};
    if (!taskId) throw new Error('taskId required');
    await db.transact([db.tx.tasks[taskId].delete()]);
    return { ok: true };
  },

  async 'update-settings'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { id, settings } = payload || {};
    if (!id || !settings) throw new Error('id and settings required');
    await db.transact([db.tx.system_settings[id].update(settings)]);
    return { ok: true };
  },

  async 'award-reward'(db: ReturnType<typeof getAdminDb>, payload: any) {
    const { userId, pts, inr, desc } = payload || {};
    if (!userId) throw new Error('userId required');
    const u = await findUserById(db, userId);
    if (!u) throw new Error('user not found');
    const addPts = Math.max(0, Math.round(Number(pts) || 0));
    const addInr = Math.max(0, Number(inr) || 0);
    const txId = newId('TXN_AWARD');
    await db.transact([
      db.tx.users[userId].update({
        balance: +(((u.balance || 0) + addInr).toFixed(2)),
        points: (u.points || 0) + addPts,
        totalEarned: +(((u.totalEarned || 0) + addInr).toFixed(2)),
      }),
      db.tx.transactions[txId].update({
        id: txId,
        desc: desc || 'Admin reward',
        type: 'task',
        amount: addInr,
        pts: addPts,
        status: 'approved',
        date: today(),
        dir: 1,
        userId,
      }),
      db.tx.transactions[txId].link({ user: userId }),
    ]);
    return { ok: true };
  },
} as const;

type Action = keyof typeof ACTIONS;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  // 1. Admin auth gate
  try {
    await requireAdmin(req);
  } catch (e: any) {
    const err = authErrorStatus(e?.message || '');
    return res.status(err.status).json(err.body);
  }

  // 2. Route action
  const body = (req.body || {}) as { action?: string; payload?: any };
  const action = String(body.action || '') as Action;
  const fn = (ACTIONS as any)[action];
  if (typeof fn !== 'function') {
    return res.status(400).json({ error: `unknown action: ${body.action}` });
  }

  try {
    const db = getAdminDb();
    const result = await fn(db, body.payload || {});
    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'action failed' });
  }
}

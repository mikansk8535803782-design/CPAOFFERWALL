// POST /api/secure/task-submit
// Server-side task submission. Creates the submission + pending placeholder
// transaction + the user→task "completed" marker. NO balance change here —
// the actual credit happens when admin approves the proof.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb } from '../_lib/db';
import { requireUser, authErrorStatus } from '../_lib/auth';
import { newId, toDocId, today } from '../_lib/ids';

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

  const body = (req.body || {}) as { taskId?: string; proofRef?: string; link?: string };
  const taskId = String(body.taskId || '').trim();
  if (!taskId) return res.status(400).json({ error: 'taskId required' });

  const db = getAdminDb();
  const tQ = await db.query({ tasks: { $: { where: { id: taskId } } } });
  const task = tQ.tasks?.[0] as any;
  if (!task) return res.status(404).json({ error: 'task not found' });

  // Prevent duplicate submission for the same task by the same user
  const dupQ = await db.query({
    submissions: { $: { where: { taskId, userId: user.id } } },
  });
  if ((dupQ.submissions || []).length > 0) {
    return res.status(409).json({ error: 'already submitted for this task' });
  }

  const subId = newId('SUB');
  const txnId = newId('TXN_TASK');
  const completedId = toDocId(`${user.id}_${taskId}`);

  const proofText = body.proofRef
    ? String(body.proofRef)
    : (body.link ? `Link: ${String(body.link)}` : `Auto-Verify`);

  await db.transact([
    db.tx.submissions[subId].update({
      id: subId,
      taskId,
      userId: user.id,
      userName: `${user.fname} ${user.lname}`,
      proof: proofText,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }),
    db.tx.submissions[subId].link({ user: user.id }),
    db.tx.transactions[txnId].update({
      id: txnId,
      desc: `${task.title} (Verification Pending)`,
      type: 'task',
      amount: 0,
      pts: 0,
      status: 'pending',
      date: today(),
      dir: 1,
      taskId,
      userId: user.id,
    }),
    db.tx.transactions[txnId].link({ user: user.id }),
    db.tx.completed_tasks[completedId].update({
      id: completedId,
      userId: user.id,
      taskId,
    }),
    db.tx.completed_tasks[completedId].link({ user: user.id }),
  ]);

  return res.status(200).json({ ok: true, submissionId: subId });
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Thin wrapper around `fetch()` for our `/api/secure/*` endpoints.
 * Automatically attaches the InstantDB session token from `db.useAuth()`.
 *
 * All mutations that affect balance/points/role/refs/suspended now flow
 * through these helpers — the underlying DB rules block direct client writes.
 */

let _token: string | null = null;

/** Called by App on every render: keeps the current InstantDB token. */
export function setAuthToken(token: string | null) {
  _token = token;
}

async function call<T = any>(path: string, body: any = {}): Promise<T> {
  if (!_token) throw new Error('You are not signed in.');
  const res = await fetch(`/api/secure/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${_token}`,
    },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status}).`);
  }
  return json as T;
}

// ─── User-facing actions ──────────────────────────────────────────────────
export const secureApi = {
  checkin: () => call('checkin', {}),
  withdraw: (amount: number, method: string, dest: string) =>
    call('withdraw', { amount, method, dest }),
  taskSubmit: (taskId: string, proofRef?: string, link?: string) =>
    call('task-submit', { taskId, proofRef, link }),
  linkSponsor: (sponsorCode: string) => call('link-sponsor', { sponsorCode }),
  register: (data: { fname: string; lname: string; mobile: string; refBy: string | null }) =>
    call('register', data),

  // ─── Admin actions (routed through /api/secure/admin) ─────────────────
  adminApproveProof: (submissionId: string) =>
    call('admin', { action: 'approve-proof', payload: { submissionId } }),
  adminRejectProof: (submissionId: string) =>
    call('admin', { action: 'reject-proof', payload: { submissionId } }),
  adminApprovePayout: (payoutId: string) =>
    call('admin', { action: 'approve-payout', payload: { payoutId } }),
  adminRejectPayout: (payoutId: string) =>
    call('admin', { action: 'reject-payout', payload: { payoutId } }),
  adminToggleSuspend: (userId: string) =>
    call('admin', { action: 'toggle-suspend', payload: { userId } }),
  adminUpdateUser: (userId: string, fields: Record<string, any>) =>
    call('admin', { action: 'update-user', payload: { userId, fields } }),
  adminDeleteUser: (userId: string) =>
    call('admin', { action: 'delete-user', payload: { userId } }),
  adminResolveTicket: (ticketId: string, reply: string) =>
    call('admin', { action: 'resolve-ticket', payload: { ticketId, reply } }),
  adminBroadcast: (message: string) =>
    call('admin', { action: 'broadcast', payload: { message } }),
  adminAddTask: (task: Record<string, any>) =>
    call('admin', { action: 'add-task', payload: { task } }),
  adminDeleteTask: (taskId: string) =>
    call('admin', { action: 'delete-task', payload: { taskId } }),
  adminUpdateSettings: (id: string, settings: Record<string, any>) =>
    call('admin', { action: 'update-settings', payload: { id, settings } }),
  adminAwardReward: (userId: string, pts: number, inr: number, desc: string) =>
    call('admin', { action: 'award-reward', payload: { userId, pts, inr, desc } }),
};

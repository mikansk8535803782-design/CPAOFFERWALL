// Server-side auth helpers.
// Verifies an InstantDB refresh-token from the Authorization header and
// loads the corresponding user record from our `users` namespace.

import type { VercelRequest } from '@vercel/node';
import { getAdminDb } from './db';

export interface AppUserRecord {
  id: string;
  fname: string;
  lname: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
  points: number;
  totalEarned: number;
  totalWithdrawn: number;
  tasksCompleted: number;
  refs: number;
  suspended?: boolean;
  fraudFlag?: boolean;
  refCode: string;
  refBy?: string | null;
  upi?: string;
  trc20?: string;
  bep20?: string;
  lastCheckIn?: string;
  streakCount?: number;
}

/** Extract a Bearer token from the Authorization header. */
function readBearer(req: VercelRequest): string | null {
  const raw = req.headers.authorization || req.headers.Authorization;
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Verify the caller's InstantDB session token and resolve them to the
 * matching row in our `users` namespace. Throws an Error with a stable
 * message that handlers turn into a 401.
 */
export async function requireUser(req: VercelRequest): Promise<AppUserRecord> {
  const token = readBearer(req);
  if (!token) throw new Error('UNAUTHENTICATED');

  const db = getAdminDb();
  let authUser: any;
  try {
    authUser = await db.auth.verifyToken(token);
  } catch {
    throw new Error('INVALID_TOKEN');
  }
  if (!authUser?.email) throw new Error('INVALID_TOKEN');

  // Locate the matching row in our user namespace by email (InstantDB's
  // $users namespace uses a different id from our application user.id).
  const q = await db.query({
    users: { $: { where: { email: String(authUser.email).toLowerCase() } } },
  });
  const row = q.users?.[0] as AppUserRecord | undefined;
  if (!row) throw new Error('USER_RECORD_MISSING');
  if (row.suspended) throw new Error('SUSPENDED');
  return row;
}

/** Same as requireUser, but additionally enforces admin role. */
export async function requireAdmin(req: VercelRequest): Promise<AppUserRecord> {
  const user = await requireUser(req);
  if (user.role !== 'admin') throw new Error('FORBIDDEN');
  return user;
}

/** Map our well-known auth error messages to HTTP responses. */
export function authErrorStatus(message: string): { status: number; body: { error: string } } {
  switch (message) {
    case 'UNAUTHENTICATED':
    case 'INVALID_TOKEN':
      return { status: 401, body: { error: message.toLowerCase() } };
    case 'FORBIDDEN':
      return { status: 403, body: { error: 'forbidden' } };
    case 'SUSPENDED':
      return { status: 403, body: { error: 'account suspended' } };
    case 'USER_RECORD_MISSING':
      return { status: 404, body: { error: 'user not found' } };
    default:
      return { status: 500, body: { error: 'auth check failed' } };
  }
}

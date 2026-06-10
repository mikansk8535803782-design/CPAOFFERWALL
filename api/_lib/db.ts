// Shared InstantDB admin SDK instance.
// Server-only. NEVER import from /frontend/src.

import { init } from '@instantdb/admin';

let _db: ReturnType<typeof init> | null = null;

export function getAdminDb() {
  if (_db) return _db;
  const appId = process.env.INSTANT_APP_ID || process.env.VITE_INSTANT_APP_ID;
  const adminToken = process.env.INSTANT_ADMIN_TOKEN;
  if (!appId || !adminToken) {
    throw new Error('InstantDB admin SDK not configured: set INSTANT_APP_ID and INSTANT_ADMIN_TOKEN.');
  }
  _db = init({ appId, adminToken });
  return _db;
}

// Small id helper shared by secure endpoints.
// Produces a deterministic UUIDv4-shaped string from any seed so that
// the same key (e.g. an InstantDB row id) is generated on retries.

import crypto from 'crypto';

export function toDocId(seed: string): string {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32),
  ].join('-');
}

export function newId(prefix = 'id'): string {
  return toDocId(`${prefix}_${Date.now()}_${Math.random()}`);
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

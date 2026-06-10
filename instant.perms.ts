/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * InstantDB permission rules — defence-in-depth at the database layer.
 *
 * These rules are evaluated SERVER-SIDE by InstantDB on every client write,
 * so even a tampered browser console (e.g. `db.tx.users[me].update({balance: 1e9})`)
 * is rejected before the row is touched.
 *
 * Push to InstantDB with:
 *
 *     npx instant-cli@latest push perms
 *
 * Re-run after any rule edit. CI should also run this on every deploy.
 *
 * ──────────────────────────────────────────────────────────────────────────
 *  Threat model
 * ──────────────────────────────────────────────────────────────────────────
 *  • Untrusted attacker = any signed-in user (auth.id != null).
 *  • Trusted = admin SDK (server-side functions with INSTANT_ADMIN_TOKEN).
 *  • Goal: every reward/balance/points/role mutation MUST go through a
 *    server endpoint (`/api/secure/*`) that re-validates business rules.
 *
 *  Field-level rules use `data.<field> == newData.<field>` to assert that
 *  a particular column was NOT touched on a client-initiated `update`.
 * ──────────────────────────────────────────────────────────────────────────
 */

import type { InstantRules } from '@instantdb/react';

const rules = {
  // ───────────────────────────────────────────────────────────────
  // Default-deny for any unlisted namespace
  // ───────────────────────────────────────────────────────────────
  $default: {
    allow: {
      view: 'false',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // users — public read of leaderboard-safe fields; self-update of
  // PROFILE FIELDS ONLY. All monetary fields are immutable client-side.
  // ───────────────────────────────────────────────────────────────
  users: {
    allow: {
      // Anyone signed-in can read the user list (needed for leaderboard,
      // referral chain walk, admin panel). If you want stricter privacy,
      // change this to `"auth.id != null && auth.id == data.id"` and
      // build a separate `public_profiles` namespace for the leaderboard.
      view: 'auth.id != null',

      // Client cannot create rows directly — sign-up goes through
      // /api/secure/register which uses the admin SDK.
      create: 'false',

      // Self-update: only the row owner, and only safe profile fields.
      // Any attempt to modify balance, points, totalEarned,
      // totalWithdrawn, tasksCompleted, refs, suspended, fraudFlag,
      // role, or refBy from the client will be rejected.
      update:
        "auth.id != null && auth.id == data.id" +
        " && data.balance == newData.balance" +
        " && data.points == newData.points" +
        " && data.totalEarned == newData.totalEarned" +
        " && data.totalWithdrawn == newData.totalWithdrawn" +
        " && data.tasksCompleted == newData.tasksCompleted" +
        " && data.refs == newData.refs" +
        " && data.suspended == newData.suspended" +
        " && data.fraudFlag == newData.fraudFlag" +
        " && data.role == newData.role" +
        " && data.refBy == newData.refBy" +
        " && data.refCode == newData.refCode" +
        " && data.email == newData.email" +
        " && data.id == newData.id",

      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // tasks — read for all, write admin-only (server)
  // ───────────────────────────────────────────────────────────────
  tasks: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // transactions — user reads own; writes are server-only
  // (commission cascade, withdrawal debit, task reward credit
  // are all financially sensitive)
  // ───────────────────────────────────────────────────────────────
  transactions: {
    allow: {
      view: 'auth.id != null && (auth.id == data.userId)',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // submissions — user can create their own (proof upload),
  // user can read own. Status update is admin-only.
  // ───────────────────────────────────────────────────────────────
  submissions: {
    allow: {
      view: 'auth.id != null && auth.id == data.userId',
      create:
        "auth.id != null && auth.id == newData.userId" +
        " && newData.status == 'pending'",
      update: 'false', // admin only via /api/secure/admin
      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // payouts — user can READ own, writes are server-only.
  // (Client cannot create a payout directly because it would
  // bypass the balance check; goes through /api/secure/withdraw.)
  // ───────────────────────────────────────────────────────────────
  payouts: {
    allow: {
      view: 'auth.id != null && auth.id == data.userId',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // notifications — user reads only their own; writes are server-only
  // ───────────────────────────────────────────────────────────────
  notifications: {
    allow: {
      view: 'auth.id != null && auth.id == data.userId',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // support_tickets — user creates and reads own, writes are server-only
  // ───────────────────────────────────────────────────────────────
  support_tickets: {
    allow: {
      view: 'auth.id != null && auth.id == data.userId',
      create:
        "auth.id != null && auth.id == newData.userId" +
        " && newData.status == 'pending'",
      update: 'false',
      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // completed_tasks — user reads own; create is locked to self.
  // We allow create from client because the row carries no reward
  // by itself (rewards come via the linked submission's approval flow).
  // ───────────────────────────────────────────────────────────────
  completed_tasks: {
    allow: {
      view: 'auth.id != null && auth.id == data.userId',
      create: 'auth.id != null && auth.id == newData.userId',
      update: 'false',
      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Task_Ledger — user reads own; writes server-only
  // ───────────────────────────────────────────────────────────────
  Task_Ledger: {
    allow: {
      view: 'auth.id != null && auth.id == data.userId',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // system_settings — readable by all signed-in users (UI needs
  // ptsToCashRate, minWithdrawal, etc); writes are admin-only.
  // ───────────────────────────────────────────────────────────────
  system_settings: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },

  systemConfig: {
    allow: {
      view: 'auth.id != null',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },

  // ───────────────────────────────────────────────────────────────
  // cpaConversions — audit log written only by the CPALead postback
  // (server endpoint). Users have no read/write access from the client.
  // ───────────────────────────────────────────────────────────────
  cpaConversions: {
    allow: {
      view: 'false',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },
} satisfies InstantRules;

export default rules;

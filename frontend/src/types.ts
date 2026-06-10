/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  fname: string;
  lname: string;
  email: string;
  pass: string;
  mobile: string;
  role: 'user' | 'admin';
  points: number;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  tasksCompleted: number;
  refs: number;
  upi?: string;
  trc20?: string;
  bep20?: string;
  suspended: boolean;
  regDate: string;
  refCode: string;
  refBy: string | null;
  fraudFlag?: boolean;
  lastCheckIn?: string;
  streakCount?: number;
  lastIp?: string;
  userAgent?: string;
  isIPLocked?: boolean;
}

export interface Task {
  id: string;
  title: string;
  desc: string;
  type: 'social' | 'app' | 'survey' | 'all';
  pts: number;
  value: number;
  icon: string;
  status: 'open' | 'hot' | 'done';
  proof: 'screenshot' | 'auto';
}

export interface Offer {
  id: string;
  title: string;
  desc: string;
  pts: number;
  value: number;
  icon: string;
  network: string;
  time: string;
}

export interface Transaction {
  id: string;
  desc: string;
  type: 'task' | 'referral' | 'offer' | 'cpa' | 'withdraw';
  amount: number;
  pts: number;
  status: 'approved' | 'pending' | 'rejected' | 'paid' | 'refunded';
  date: string;
  dir: 1 | -1;
  taskId?: string;
  userId?: string;
}

/**
 * CPALead conversion log — written by the postback webhook.
 * Document key MUST equal the CPALead lead_id to guarantee idempotency:
 * duplicate postbacks from CPALead's retry queue will silently no-op.
 */
export interface CpaConversion {
  id: string;           // = leadId (UUID-encoded for InstantDB)
  leadId: string;       // raw lead_id from CPALead
  userId: string;       // our InstantDB user UUID (came via &subid=)
  userName: string;
  offerId: string;
  campaignId: string;
  campaignName: string;
  payoutUsd: number;    // raw payout from CPALead (USD)
  payoutInr: number;    // INR credited to user after margin
  pointsCredited: number;
  countryIso: string;
  ipAddress: string;
  rawPayload: string;   // full query/body JSON for audit
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  proof: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  userName: string;
  method: string;
  dest: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface PromoBannerAd {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  bgGradient: string; // e.g., 'from-pink-500 to-purple-500'
  borderColor: string; // e.g., 'border-pink-500/30'
  badgeBg: string; // e.g., 'bg-pink-500/10 text-pink-400'
  actionUrl?: string;
  actionText?: string;
  active: boolean;
}

export interface SystemSettings {
  ptsToCashRate: number;
  minWithdrawal: number;
  signupBonus: number;
  disableOfferwall: boolean;
  disableTasks: boolean;
  disableReferrals: boolean;
  vipMultiplier: number;
  promoActive?: boolean;
  promoTitle?: string;
  promoText?: string;
  promoBanners?: PromoBannerAd[];
  // CPALead network settings
  cpaPayoutRatio?: number;  // 0–1, fraction of CPALead payout shared with user (default 0.7)
  cpaUsdToInr?: number;     // USD→INR rate used for crediting (default 83)
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  reply?: string;
  createdAt: string;
}

export interface Referral {
  userId: string;
  name: string;
  level: number;
  joined: string;
  tasksDone: number;
  comm: number;
}

export interface NotificationItem {
  id: string;
  icon: string;
  msg: string;
  time: string;
  userId?: string;
  /** Optional media URL — when set, renders inline below the message. */
  mediaUrl?: string;
  /** `'image'` or `'video'`. Auto-detected from URL if omitted. */
  mediaType?: 'image' | 'video';
  /** Optional outbound link (call-to-action target). */
  linkUrl?: string;
}

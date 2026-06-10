/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { init, tx, id } from '@instantdb/react';
import { 
  Users, BarChart3, CheckSquare, Wallet, Globe, User as UserIcon, ShieldAlert, 
  Settings, Menu, X, Bell, LogOut, Play, DollarSign, Award, ArrowUpRight, HelpCircle, Briefcase, Home
} from 'lucide-react';

// Initialize Instant DB for React
const APP_ID = (import.meta as any).env?.VITE_INSTANT_APP_ID || 'da1a9780-60b6-4df1-8e99-4c2f602b9e67';
export const db = init({ appId: APP_ID });


import { User, Task, Offer, Transaction, TaskSubmission, WithdrawRequest, Referral, NotificationItem, SystemSettings, SupportTicket } from './types';

// Lazy load massive component bundles for optimal bundle splitting and extremely fast initial interactivity times
const TaskMarketplace = lazy(() => import('./components/TaskMarketplace'));
const Offerwall = lazy(() => import('./components/Offerwall'));
const WalletView = lazy(() => import('./components/WalletView'));
const ReferralTab = lazy(() => import('./components/ReferralTab'));
const ProfileTab = lazy(() => import('./components/ProfileTab'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AdminControlPanel = lazy(() => import('./components/AdminControlPanel'));
const HelpChatbot = lazy(() => import('./components/HelpChatbot'));

// Standard fallback placeholder for lazy loaded components
const TabLoadingPlaceholder = () => (
  <div className="w-full bg-[#1a1a24]/50 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center space-y-4 animate-pulse min-h-[400px]">
    <div className="w-12 h-12 rounded-2xl bg-[#7c6cff]/10 flex items-center justify-center border-t-2 border-[#7c6cff] animate-spin">
      <div className="w-4 h-4 rounded-full bg-[#7c6cff]"></div>
    </div>
    <div className="space-y-1 text-center">
      <h3 className="text-sm font-semibold font-display text-white">Syncing Security Core...</h3>
      <p className="text-[10px] text-[#5a5a72] font-mono tracking-wider uppercase">Venting Code Modules</p>
    </div>
  </div>
);

// ─────────────── SEED DATA ───────────────
const INITIAL_USERS: User[] = [
  {
    id: 'USR0001',
    fname: 'Rahul',
    lname: 'Kumar',
    email: 'user@earnhub.in',
    pass: 'user123',
    mobile: '+91 98765 43210',
    role: 'user',
    points: 4950,
    balance: 247.50,
    totalEarned: 847.50,
    totalWithdrawn: 600.00,
    tasksCompleted: 34,
    refs: 12,
    upi: 'rahul@okicici',
    trc20: '',
    bep20: '',
    suspended: false,
    regDate: '2025-10-12',
    refCode: 'USR0001',
    refBy: null
  },
  {
    id: 'USR0002',
    fname: 'Priya',
    lname: 'Sharma',
    email: 'priya55@email.com',
    pass: 'priya123',
    mobile: '+91 87654 32101',
    role: 'user',
    points: 2200,
    balance: 110.00,
    totalEarned: 310.00,
    totalWithdrawn: 200.00,
    tasksCompleted: 18,
    refs: 5,
    upi: 'priya@okhdfc',
    trc20: '',
    bep20: '',
    suspended: false,
    regDate: '2025-11-03',
    refCode: 'USR0002',
    refBy: 'USR0001'
  },
  {
    id: 'USR0003',
    fname: 'Amit',
    lname: 'Dey',
    email: 'amit@email.com',
    pass: 'amit123',
    mobile: '+91 76543 21012',
    role: 'user',
    points: 1800,
    balance: 90.00,
    totalEarned: 190.00,
    totalWithdrawn: 100.00,
    tasksCompleted: 12,
    refs: 2,
    upi: '',
    trc20: 'TXFake34CharAddr12345678901234',
    bep20: '',
    suspended: false,
    regDate: '2025-12-01',
    refCode: 'USR0003',
    refBy: 'USR0001'
  },
  {
    id: 'USR0004',
    fname: 'Sneha',
    lname: 'Roy',
    email: 'sneha@email.com',
    pass: 'sneha123',
    mobile: '+91 65432 10123',
    role: 'user',
    points: 800,
    balance: 40.00,
    totalEarned: 40.00,
    totalWithdrawn: 0.00,
    tasksCompleted: 5,
    refs: 0,
    upi: 'sneha@ybl',
    trc20: '',
    bep20: '',
    suspended: false,
    regDate: '2026-01-15',
    refCode: 'USR0004',
    refBy: 'USR0002'
  },
  {
    id: 'ADM001',
    fname: 'Admin',
    lname: 'EarnHub',
    email: 'admin@earnhub.in',
    pass: 'admin123',
    mobile: '+91 99999 00000',
    role: 'admin',
    points: 0,
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    tasksCompleted: 0,
    refs: 0,
    upi: '',
    trc20: '',
    bep20: '',
    suspended: false,
    regDate: '2025-09-01',
    refCode: 'ADMIN',
    refBy: null
  },
  {
    id: 'USR0005',
    fname: 'Fraud',
    lname: 'User',
    email: 'fraud@email.com',
    pass: 'pass123',
    mobile: '+91 11111 11111',
    role: 'user',
    points: 5000,
    balance: 250.00,
    totalEarned: 250.00,
    totalWithdrawn: 0.00,
    tasksCompleted: 200,
    refs: 0,
    suspended: false,
    regDate: '2026-02-01',
    refCode: 'USR0005',
    refBy: 'USR0001',
    fraudFlag: true
  }
];

const INITIAL_TASKS: Task[] = [
  { id: 'T001', title: 'Subscribe YouTube channel', desc: 'Subscribe to our official channel & watch any video for 60 seconds.', type: 'social', pts: 150, value: 7.5, icon: '▶️', status: 'open', proof: 'screenshot' },
  { id: 'T002', title: 'Join Telegram channel', desc: 'Join the channel and stay active for at least 7 days.', type: 'social', pts: 80, value: 4.0, icon: '✈️', status: 'open', proof: 'screenshot' },
  { id: 'T003', title: 'Retweet & like Twitter post', desc: 'Retweet our latest product launch post, like it, and follow the handles.', type: 'social', pts: 60, value: 3.0, icon: '🐦', status: 'open', proof: 'screenshot' },
  { id: 'T004', title: 'Install & rate Play Store app', desc: 'Install our sponsor\'s app, open it, and provide a 5-star rating.', type: 'app', pts: 300, value: 15.0, icon: '📱', status: 'hot', proof: 'screenshot' },
  { id: 'T005', title: 'Facebook page like + share', desc: 'Like our promotion page and share our pinned post publicly.', type: 'social', pts: 70, value: 3.5, icon: '👍', status: 'open', proof: 'screenshot' },
  { id: 'T006', title: 'Instagram follow + story', desc: 'Follow the sponsor account and view their current highlight story.', type: 'social', pts: 90, value: 4.5, icon: '📸', status: 'open', proof: 'screenshot' },
  { id: 'T007', title: 'Play game for 10 minutes', desc: 'Download the casual game, reach stage 5, and play for 10 min.', type: 'app', pts: 250, value: 12.5, icon: '🎮', status: 'hot', proof: 'screenshot' },
  { id: 'T008', title: 'Register on website', desc: 'Sign up and verify your email directly on our partner\'s landing page.', type: 'app', pts: 200, value: 10.0, icon: '🌐', status: 'open', proof: 'screenshot' },
  { id: 'T009', title: 'Complete consumer survey', desc: 'Complete a brief 5-minute feedback questionnaire.', type: 'survey', pts: 120, value: 6.0, icon: '📝', status: 'open', proof: 'auto' },
  { id: 'T010', title: 'Watch 3 sponsorships ads', desc: 'Unlock and view three full promotional ads from AdGate.', type: 'survey', pts: 90, value: 4.5, icon: '📺', status: 'open', proof: 'auto' }
];

const INITIAL_OFFERS: Offer[] = [
  { id: 'O001', title: 'CPAlead — App installation offer', desc: 'Install the app through CPAlead and complete the initial questionnaire.', pts: 500, value: 25.0, icon: '💎', network: 'CPAlead', time: '10 min' },
  { id: 'O002', title: 'AdGate — Email verification bonus', desc: 'Register your email ID on the portal to get instant credit.', pts: 200, value: 10.0, icon: '📧', network: 'AdGate', time: '2 min' },
  { id: 'O003', title: 'OfferToro — Signup verification', desc: 'Register with valid credentials on target platform.', pts: 350, value: 17.5, icon: '🎁', network: 'OfferToro', time: '5 min' },
  { id: 'O004', title: 'CPAlead — Quick visual poll', desc: 'Pristinely finish 3 mini visual polls on CPAlead wall.', pts: 450, value: 22.5, icon: '📋', network: 'CPAlead', time: '15 min' },
  { id: 'O005', title: 'AdGem — Video streaming sequence', desc: 'Complete streaming six consecutive promos on AdGem.', pts: 180, value: 9.0, icon: '📹', network: 'AdGem', time: '8 min' }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'TXN001', desc: 'YouTube channel subscribe task', type: 'task', amount: 7.5, pts: 150, status: 'approved', date: '2026-06-06', dir: 1, taskId: 'T001' },
  { id: 'TXN002', desc: 'Commission L1 commission from Priya Sharma', type: 'referral', amount: 15.0, pts: 300, status: 'approved', date: '2026-06-06', dir: 1 },
  { id: 'TXN003', desc: 'CPA Offer Completion: CPAlead app survey', type: 'offer', amount: 25.0, pts: 500, status: 'approved', date: '2026-06-05', dir: 1 },
  { id: 'TXN004', desc: 'UPI withdrawal processing payout', type: 'withdraw', amount: -200.0, pts: 0, status: 'approved', date: '2026-06-03', dir: -1 },
  { id: 'TXN005', desc: 'Telegram channel join task', type: 'task', amount: 4.0, pts: 80, status: 'approved', date: '2026-06-02', dir: 1, taskId: 'T002' }
];

const INITIAL_SUBMISSIONS: TaskSubmission[] = [
  { id: 'SUB001', taskId: 'T004', userId: 'USR0003', userName: 'Amit Dey', proof: 'Proof identifier: secure.cloudinary.com/earnhub/sample_proof_amit.png', status: 'pending', submittedAt: '2026-06-06 14:22' },
  { id: 'SUB002', taskId: 'T001', userId: 'USR0002', userName: 'Priya Sharma', proof: 'Proof identifier: secure.cloudinary.com/earnhub/sample_proof_priya.png', status: 'pending', submittedAt: '2026-06-06 13:15' }
];

const INITIAL_PAYOUTS: WithdrawRequest[] = [
  { id: 'WD001', userId: 'USR0002', userName: 'Priya Sharma', method: 'UPI', dest: 'priya@okhdfc', amount: 100.00, status: 'pending', date: '2026-06-06' },
  { id: 'WD002', userId: 'USR0003', userName: 'Amit Dey', method: 'USDT TRC20', dest: 'TXFake34CharAddr12345678901234', amount: 90.00, status: 'pending', date: '2026-06-05' }
];

const INITIAL_REFERRALS: Referral[] = [
  { userId: 'USR0002', name: 'Priya Sharma', level: 1, joined: 'Nov 2025', tasksDone: 18, comm: 45.00 },
  { userId: 'USR0003', name: 'Amit Dey', level: 1, joined: 'Dec 2025', tasksDone: 12, comm: 20.00 },
  { userId: 'USR0004', name: 'Sneha Roy', level: 2, joined: 'Jan 2026', tasksDone: 5, comm: 3.00 }
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'N1', icon: '✅', msg: 'Your screenshot verification was approved! +150 Points added.', time: '2m ago' },
  { id: 'N4', icon: '🎁', msg: 'Bonus Points Credit Target Achieved! +500 Points added.', time: '10m ago' },
  { id: 'N2', icon: '🌐', msg: 'Priya Sharma joined via your referral link! +₹5 credited.', time: '1h ago' },
  { id: 'N3', icon: '💸', msg: 'Withdrawal of ₹200 processed successfully.', time: '3d ago' }
];

// Helper to transform any non-UUID string to a valid UUID format deterministically
function toUUID(str: string): string {
  if (!str) return '00000000-0000-4000-8000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str.toLowerCase();

  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  while (hex.length < 32) {
    hex += '0';
  }
  if (hex.length > 32) {
    hex = hex.substring(0, 32);
  }
  const p1 = hex.substring(0, 8);
  const p2 = hex.substring(8, 12);
  const p3 = '4' + hex.substring(13, 16);
  const p4 = '8' + hex.substring(17, 20);
  const p5 = hex.substring(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`.toLowerCase();
}

// Deterministically transformed seed datasets for InstantDB-compliant UUID IDs
const SEEDED_USERS: User[] = INITIAL_USERS.map(u => ({
  ...u,
  id: toUUID(u.id)
}));

const SEEDED_TASKS: Task[] = INITIAL_TASKS.map(t => ({
  ...t,
  id: toUUID(t.id)
}));

const SEEDED_TRANSACTIONS: Transaction[] = INITIAL_TRANSACTIONS.map(tx => ({
  ...tx,
  id: toUUID(tx.id),
  taskId: tx.taskId ? toUUID(tx.taskId) : undefined,
  userId: tx.userId ? toUUID(tx.userId) : toUUID('USR0001')
}));

const SEEDED_SUBMISSIONS: TaskSubmission[] = INITIAL_SUBMISSIONS.map(s => ({
  ...s,
  id: toUUID(s.id),
  taskId: toUUID(s.taskId),
  userId: toUUID(s.userId)
}));

const SEEDED_PAYOUTS: WithdrawRequest[] = INITIAL_PAYOUTS.map(p => ({
  ...p,
  id: toUUID(p.id),
  userId: toUUID(p.userId)
}));

const SEEDED_REFERRALS: Referral[] = INITIAL_REFERRALS.map(r => ({
  ...r,
  userId: toUUID(r.userId)
}));

const SEEDED_NOTIFICATIONS: NotificationItem[] = INITIAL_NOTIFICATIONS.map(n => ({
  ...n,
  id: toUUID(n.id)
}));

export default function App() {
  // ─────────────── PERSISTING STATES ───────────────
  const [sessionUser, setSessionUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('eh_session_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) {
        parsed.id = toUUID(parsed.id);
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [supportBotOpen, setSupportBotOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{sender: 'user'|'bot', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMsgs(prev => [...prev, {sender: 'user', text: chatInput}]);
    setChatInput('');
    setTimeout(() => {
      setChatMsgs(prev => [...prev, {sender: 'bot', text: 'An agent will be with you shortly. Thank you for your message.'}]);
    }, 1000);
  };

  // Authentication Fields
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [regFname, setRegFname] = useState('');
  const [regLname, setRegLname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regRef, setRegRef] = useState('');

  // Email-OTP flow (InstantDB magic codes)
  const [authStep, setAuthStep] = useState<'email' | 'otp'>('email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<{
    fname: string; lname: string; email: string; mobile: string; refBy: string | null;
  } | null>(null);

  // Toast State
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Instant DB Live Queries
  const { isLoading, error, data: dbData } = db.useQuery({
    users: {
      transactions: {},
      submissions: {},
      payouts: {},
      notifications: {},
      support_tickets: {},
      completed_tasks: {},
      Task_Ledger: {}
    },
    tasks: {},
    system_settings: {},
    systemConfig: {}, // Keep pre-existing table compatibility
    cpaConversions: {},
  });

  // Dynamically Seed Databases on very first fetch if completely empty
  useEffect(() => {
    if (isLoading) return;
    if (!dbData) return;

    const runs: any[] = [];

    // Helper elements indicating table records existence per granular user schema links
    const hasTransactions = dbData.users?.some((u: any) => u.transactions && u.transactions.length > 0);
    const hasSubmissions = dbData.users?.some((u: any) => u.submissions && u.submissions.length > 0);
    const hasPayouts = dbData.users?.some((u: any) => u.payouts && u.payouts.length > 0);
    const hasNotifications = dbData.users?.some((u: any) => u.notifications && u.notifications.length > 0);
    const hasSupportTickets = dbData.users?.some((u: any) => u.support_tickets && u.support_tickets.length > 0);
    const hasCompletedTasks = dbData.users?.some((u: any) => u.completed_tasks && u.completed_tasks.length > 0);
    const hasTaskLedger = dbData.users?.some((u: any) => u.Task_Ledger && u.Task_Ledger.length > 0);

    // 1. Seed users if empty
    if (!dbData.users || dbData.users.length === 0) {
      SEEDED_USERS.forEach(u => {
        runs.push(db.tx.users[u.id].update(u));
      });
    }

    // 2. Seed tasks if empty
    if (!dbData.tasks || dbData.tasks.length === 0) {
      SEEDED_TASKS.forEach(t => {
        runs.push(db.tx.tasks[t.id].update(t));
      });
    }

    // 3. Seed transactions if empty
    if (!hasTransactions) {
      SEEDED_TRANSACTIONS.forEach(t => {
        runs.push(db.tx.transactions[t.id].update(t));
        if (t.userId) {
          runs.push(db.tx.transactions[t.id].link({ user: t.userId }));
        }
      });
    }

    // 4. Seed submissions if empty
    if (!hasSubmissions) {
      SEEDED_SUBMISSIONS.forEach(s => {
        runs.push(db.tx.submissions[s.id].update(s));
        if (s.userId) {
          runs.push(db.tx.submissions[s.id].link({ user: s.userId }));
        }
      });
    }

    // 5. Seed payouts if empty
    if (!hasPayouts) {
      SEEDED_PAYOUTS.forEach(p => {
        runs.push(db.tx.payouts[p.id].update(p));
        if (p.userId) {
          runs.push(db.tx.payouts[p.id].link({ user: p.userId }));
        }
      });
    }

    // 6. (PDF tool usages seeding removed - feature deleted)

    // 7. Seed notifications if empty
    if (!hasNotifications) {
      SEEDED_NOTIFICATIONS.forEach(n => {
        runs.push(db.tx.notifications[n.id].update({
          ...n,
          userId: toUUID('USR0001')
        }));
        runs.push(db.tx.notifications[n.id].link({ user: toUUID('USR0001') }));
      });
    }

    // 8. Seed support_tickets if empty
    if (!hasSupportTickets) {
      const initialTickets = [
        {
          id: toUUID('TKT001'),
          userId: toUUID('USR0001'),
          userName: 'Rahul Kumar',
          userEmail: 'user@earnhub.in',
          subject: 'Points not credited for Telegram task',
          message: 'I successfully joined the channel, but my points are still showing zero. I uploaded correct screenshot confirmation.',
          status: 'pending',
          createdAt: '2026-06-07T12:00:00Z'
        },
        {
          id: toUUID('TKT002'),
          userId: toUUID('USR0002'),
          userName: 'Priya Sharma',
          userEmail: 'priya55@email.com',
          subject: 'Withdrawal delays',
          message: 'I made a BEP-20 withdrawal of ₹150. Status is pending since yesterday. Please check.',
          status: 'pending',
          createdAt: '2026-06-07T14:30:00Z'
        }
      ];
      initialTickets.forEach(t => {
        runs.push(db.tx.support_tickets[t.id].update(t));
        runs.push(db.tx.support_tickets[t.id].link({ user: t.userId }));
      });
    }

    // 9. Seed completed_tasks if empty
    if (!hasCompletedTasks) {
      const initialCompleted = [
        { id: toUUID('USR0001_T003'), userId: toUUID('USR0001'), taskId: toUUID('T003') },
        { id: toUUID('USR0001_T005'), userId: toUUID('USR0001'), taskId: toUUID('T005') }
      ];
      initialCompleted.forEach(c => {
        runs.push(db.tx.completed_tasks[c.id].update(c));
        runs.push(db.tx.completed_tasks[c.id].link({ user: c.userId }));
      });
    }

    // 10. Seed system_settings if empty
    if (!dbData.system_settings || dbData.system_settings.length === 0) {
      const sId = toUUID('global_settings');
      const initialSettings = {
        id: sId,
        ptsToCashRate: 20,
        minWithdrawal: 100,
        signupBonus: 100,
        disableOfferwall: false,
        disableTasks: false,
        disableReferrals: false,
        vipMultiplier: 1.0,
        promoActive: true,
        cpaPayoutRatio: 0.7,
        cpaUsdToInr: 83,
        promoTitle: '⚡ EXTRA 1.2X VIP MULTIPLIER ACTIVE!',
        promoText: 'Admin has enabled standard 1.2x points multiplier across all tasks & offers for the next 48 hours!',
        promoBanners: [
          {
            id: 'banner-tg',
            title: '📣 Join Official Telegram Channel',
            subtitle: 'Get free 200 PTS and stay updated with promo codes, payment proofs & support!',
            badge: 'COMMUNITY',
            bgGradient: 'from-[#0088cc]/10 via-transparent to-transparent',
            borderColor: 'border-[#0088cc]/25',
            badgeBg: 'bg-[#0088cc]/15 text-[#33b1ff]',
            actionUrl: 'https://telegram.org',
            actionText: 'Join Channel',
            active: true
          },
          {
            id: 'banner-gold',
            title: '⚡ 3-Tier Commissions Boosted!',
            subtitle: 'Earn direct commissions of 10% on your Level-1, 5% on Level-2, and 2% on Level-3 referrals.',
            badge: 'REFERRAL ALERT',
            bgGradient: 'from-amber-500/10 via-transparent to-transparent',
            borderColor: 'border-amber-500/25',
            badgeBg: 'bg-amber-500/15 text-amber-400',
            actionUrl: '#',
            actionText: 'Invite Friends',
            active: true
          }
        ]
      };
      runs.push(db.tx.system_settings[sId].update(initialSettings));
    }

    // 11. Seed Task_Ledger if empty
    if (!hasTaskLedger) {
       const initialLedger = [
         {
           id: toUUID('TL001'),
           userId: toUUID('USR0001'),
           taskTitle: 'Telegram Channel Join Task',
           status: 'Approved',
           timestamp: '2026-06-07T12:00:00Z'
         },
         {
           id: toUUID('TL002'),
           userId: toUUID('USR0001'),
           taskTitle: 'CPAlead App Install Survey',
           status: 'Pending',
           timestamp: '2026-06-07T14:30:00Z'
         },
         {
           id: toUUID('TL003'),
           userId: toUUID('USR0002'),
           taskTitle: 'Instagram Profile Follow Challenge',
           status: 'Approved',
           timestamp: '2026-06-07T15:00:00Z'
         }
       ];
       initialLedger.forEach(tl => {
         runs.push(db.tx.Task_Ledger[tl.id].update(tl));
         runs.push(db.tx.Task_Ledger[tl.id].link({ user: tl.userId }));
       });
    }

    if (runs.length > 0) {
      db.transact(runs).catch(err => console.error("Failed seeding database:", err));
    }
  }, [isLoading, dbData]);

  // Real-time Database Collections derived from InstantDB
  const dbUsers: User[] = (dbData?.users as any) || SEEDED_USERS;
  const tasks: Task[] = (dbData?.tasks as any) || SEEDED_TASKS;
  const offers: Offer[] = INITIAL_OFFERS;

  const transactions: Transaction[] = useMemo(() => {
    if (!dbData?.users) return SEEDED_TRANSACTIONS;
    const list: Transaction[] = [];
    dbData.users.forEach((u: any) => {
      if (u.transactions && Array.isArray(u.transactions)) {
        list.push(...u.transactions);
      }
    });
    return list.length > 0 ? list : SEEDED_TRANSACTIONS;
  }, [dbData?.users]);

  const submissions: TaskSubmission[] = useMemo(() => {
    if (!dbData?.users) return SEEDED_SUBMISSIONS;
    const list: TaskSubmission[] = [];
    dbData.users.forEach((u: any) => {
      if (u.submissions && Array.isArray(u.submissions)) {
        list.push(...u.submissions);
      }
    });
    return list.length > 0 ? list : SEEDED_SUBMISSIONS;
  }, [dbData?.users]);

  const payouts: WithdrawRequest[] = useMemo(() => {
    if (!dbData?.users) return SEEDED_PAYOUTS;
    const list: WithdrawRequest[] = [];
    dbData.users.forEach((u: any) => {
      if (u.payouts && Array.isArray(u.payouts)) {
        list.push(...u.payouts);
      }
    });
    return list.length > 0 ? list : SEEDED_PAYOUTS;
  }, [dbData?.users]);

  const allNotificationsList: NotificationItem[] = useMemo(() => {
    if (!dbData?.users) return SEEDED_NOTIFICATIONS;
    const list: NotificationItem[] = [];
    dbData.users.forEach((u: any) => {
      if (u.notifications && Array.isArray(u.notifications)) {
        list.push(...u.notifications);
      }
    });
    return list.length > 0 ? list : SEEDED_NOTIFICATIONS;
  }, [dbData?.users]);

  const allCompletedTasksList: any[] = useMemo(() => {
    if (!dbData?.users) return [];
    const list: any[] = [];
    dbData.users.forEach((u: any) => {
      if (u.completed_tasks && Array.isArray(u.completed_tasks)) {
        list.push(...u.completed_tasks);
      }
    });
    return list;
  }, [dbData?.users]);

  const allTaskLedgerList: any[] = useMemo(() => {
    if (!dbData?.users) return [];
    const list: any[] = [];
    dbData.users.forEach((u: any) => {
      if (u.Task_Ledger && Array.isArray(u.Task_Ledger)) {
        list.push(...u.Task_Ledger);
      }
    });
    return list;
  }, [dbData?.users]);
  // Dynamic referral tracking calculated in real-time across up to 3 tiers from actual users and transactions
  const referrals: Referral[] = useMemo(() => {
    if (!sessionUser) return [];

    // Find Level 1: users directly sponsored by current user's refCode
    const l1Users = dbUsers.filter(u => u.refBy === sessionUser.refCode);
    const l1Codes = new Set(l1Users.map(u => u.refCode));

    // Find Level 2: users sponsored by Level 1 users
    const l2Users = dbUsers.filter(u => u.refBy ? l1Codes.has(u.refBy) : false);
    const l2Codes = new Set(l2Users.map(u => u.refCode));

    // Find Level 3: users sponsored by Level 2 users
    const l3Users = dbUsers.filter(u => u.refBy ? l2Codes.has(u.refBy) : false);

    const resultList: Referral[] = [];

    const formatJoinDate = (dStr: string, fallback: string) => {
      try {
        if (!dStr) return fallback;
        const parts = dStr.split('-');
        if (parts.length === 3) {
          const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        return dStr;
      } catch {
        return fallback;
      }
    };

    // Tier 1 direct referrals
    l1Users.forEach(u => {
      const txs = transactions.filter(tx => 
        tx.userId === sessionUser.id && 
        tx.type === 'referral' && 
        tx.status === 'approved' && 
        tx.desc.includes(u.fname)
      );
      let comm = txs.reduce((sum, t) => sum + t.amount, 0);

      // Preserve seed stats for initial users for consistency
      if (u.refCode === 'USR0002' && comm === 0) comm = 45.00;
      if (u.refCode === 'USR0003' && comm === 0) comm = 20.00;

      resultList.push({
        userId: u.id,
        name: `${u.fname} ${u.lname}`,
        level: 1,
        joined: formatJoinDate(u.regDate, 'Nov 2025'),
        tasksDone: u.tasksCompleted,
        comm
      });
    });

    // Tier 2 in-direct referrals
    l2Users.forEach(u => {
      const txs = transactions.filter(tx => 
        tx.userId === sessionUser.id && 
        tx.type === 'referral' && 
        tx.status === 'approved' && 
        tx.desc.includes(u.fname)
      );
      let comm = txs.reduce((sum, t) => sum + t.amount, 0);

      if (u.refCode === 'USR0004' && comm === 0) comm = 3.00;

      resultList.push({
        userId: u.id,
        name: `${u.fname} ${u.lname}`,
        level: 2,
        joined: formatJoinDate(u.regDate, 'Jan 2026'),
        tasksDone: u.tasksCompleted,
        comm
      });
    });

    // Tier 3 in-direct referrals
    l3Users.forEach(u => {
      const txs = transactions.filter(tx => 
        tx.userId === sessionUser.id && 
        tx.type === 'referral' && 
        tx.status === 'approved' && 
        tx.desc.includes(u.fname)
      );
      const comm = txs.reduce((sum, t) => sum + t.amount, 0);

      resultList.push({
        userId: u.id,
        name: `${u.fname} ${u.lname}`,
        level: 3,
        joined: formatJoinDate(u.regDate, 'Feb 2026'),
        tasksDone: u.tasksCompleted,
        comm
      });
    });

    return resultList;
  }, [dbUsers, transactions, sessionUser]);
  const notifications: NotificationItem[] = useMemo(() => {
    if (!sessionUser) return [];
    return allNotificationsList.filter((n: any) => !n.userId || n.userId === sessionUser.id);
  }, [allNotificationsList, sessionUser]);

  const supportTickets: SupportTicket[] = useMemo(() => {
    if (!dbData?.users) return [];
    const list: SupportTicket[] = [];
    dbData.users.forEach((u: any) => {
      if (u.support_tickets && Array.isArray(u.support_tickets)) {
        list.push(...u.support_tickets);
      }
    });
    return list;
  }, [dbData?.users]);

  const dbSystemSettingsObj = (dbData?.system_settings?.find((s: any) => s.id === toUUID('global_settings')) || {}) as any;
  const systemSettings: SystemSettings = {
    ptsToCashRate: dbSystemSettingsObj.ptsToCashRate ?? 20,
    minWithdrawal: dbSystemSettingsObj.minWithdrawal ?? 100,
    signupBonus: dbSystemSettingsObj.signupBonus ?? 100,
    disableOfferwall: dbSystemSettingsObj.disableOfferwall ?? false,
    disableTasks: dbSystemSettingsObj.disableTasks ?? false,
    disableReferrals: dbSystemSettingsObj.disableReferrals ?? false,
    vipMultiplier: dbSystemSettingsObj.vipMultiplier ?? 1.0,
    promoActive: dbSystemSettingsObj.promoActive ?? false,
    promoTitle: dbSystemSettingsObj.promoTitle ?? '',
    promoText: dbSystemSettingsObj.promoText ?? '',
    promoBanners: dbSystemSettingsObj.promoBanners ?? [],
    cpaPayoutRatio: dbSystemSettingsObj.cpaPayoutRatio ?? 0.7,
    cpaUsdToInr: dbSystemSettingsObj.cpaUsdToInr ?? 83,
  };

  const completedTasks: string[] = sessionUser 
    ? allCompletedTasksList
        .filter((c: any) => c.userId === sessionUser.id)
        .map((c: any) => c.taskId)
    : [];

  // Mapped React state trigger matching updated db properties in real-time
  const liveUser = sessionUser
    ? (dbUsers.find(u => u.id === sessionUser.id) || sessionUser)
    : null;

  // Sync session ID to LocalStorage
  useEffect(() => {
    localStorage.setItem('eh_session_user', JSON.stringify(sessionUser));
  }, [sessionUser]);

  // Navigation Options Array
  const navItems = liveUser?.role === 'admin'
    ? [
        { id: 'admin-analytics', label: 'Admin Analytics', icon: BarChart3, sec: 'Workspace' },
        { id: 'admin-proofs', label: 'Verify Queue', icon: CheckSquare, sec: 'Workspace', badge: String(submissions.filter(x => x.status === 'pending').length) },
        { id: 'admin-payouts', label: 'Payout Requests', icon: DollarSign, sec: 'Workspace', badge: String(payouts.filter(x => x.status === 'pending').length) },
        { id: 'admin-fraud', label: 'Fraud Detection', icon: ShieldAlert, sec: 'Workspace' },
        { id: 'admin-users', label: 'User Directory', icon: Users, sec: 'Workspace' },
        { id: 'admin-offers', label: 'Task Campaigns', icon: Briefcase, sec: 'Workspace' },
        { id: 'admin-settings', label: 'Global Setup', icon: Settings, sec: 'Workspace' },
        { id: 'admin-control', label: 'Admin Control Panel', icon: ShieldAlert, sec: 'Workspace' },
        { id: 'profile', label: 'Admin Profile', icon: UserIcon, sec: 'Account' }
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, sec: 'Main' },
        ...(!systemSettings.disableTasks ? [{ id: 'tasks', label: 'Tasks', icon: CheckSquare, sec: 'Main', badge: String(tasks.length - completedTasks.length) }] : []),
        ...(!systemSettings.disableOfferwall ? [{ id: 'offerwall', label: 'CPA Offerwall', icon: Globe, sec: 'Main' }] : []),
        { id: 'wallet', label: 'My Wallet', icon: Wallet, sec: 'Earnings' },
        ...(!systemSettings.disableReferrals ? [{ id: 'referral', label: 'Referrals', icon: Users, sec: 'Earnings' }] : []),
        { id: 'profile', label: 'My Profile', icon: UserIcon, sec: 'Account' },
        { id: 'support', label: 'Support & Help', icon: HelpCircle, sec: 'Account' }
      ];

  const liveConfig: any = dbData?.systemConfig?.find((c: any) => c.id === 'global_config') || {};
  const liveAnnouncement = liveConfig.System_Announcement || "Admin Announcement Broadcast Banner Text View: Double points on all Offerwall tasks this weekend!";
  const liveMaintenance = liveConfig.System_Maintenance_Mode;

  // Role-based safe view guard routing redirection
  useEffect(() => {
    if (liveUser) {
      const isValidView = navItems.some(item => item.id === activeView);
      if (!isValidView && navItems.length > 0) {
        setActiveView(navItems[0].id);
      }
    }
  }, [liveUser, activeView, navItems]);

  const triggerToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMsg({ type, text });
  };

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // (PDF tool execution & simulation handlers removed)

  // ─────────────── HANDLERS (Email-OTP auth via InstantDB) ───────────────

  // Reset OTP form
  const resetOtpFlow = () => {
    setAuthStep('email');
    setOtpEmail('');
    setOtpCode('');
    setOtpLoading(false);
    setPendingRegistration(null);
  };

  // STEP 1a — Sign-in: send OTP to existing user's email
  const handleSendSignInOtp = async () => {
    const email = loginEmail.trim().toLowerCase();
    if (!email) {
      triggerToast('error', 'Please enter your email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      triggerToast('error', 'Please enter a valid email address.');
      return;
    }

    const found = dbUsers.find(u => u.email.toLowerCase() === email);
    if (!found) {
      triggerToast('error', 'No account found with this email. Please register first.');
      return;
    }
    if (found.suspended) {
      triggerToast('error', 'This account has been suspended.');
      return;
    }

    setOtpLoading(true);
    try {
      await db.auth.sendMagicCode({ email });
      setOtpEmail(email);
      setAuthStep('otp');
      triggerToast('success', `Verification code sent to ${email}.`);
    } catch (err: any) {
      const msg = err?.body?.message || err?.message || 'Could not send code. Try again.';
      triggerToast('error', msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // STEP 1b — Register: validate fields then send OTP
  const handleSendRegisterOtp = async () => {
    if (!regFname.trim() || !regEmail.trim() || !regMobile.trim()) {
      triggerToast('error', 'Please fill First Name, Email and Mobile.');
      return;
    }
    const email = regEmail.trim().toLowerCase();
    const mobile = regMobile.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      triggerToast('error', 'Invalid email format.');
      return;
    }
    const digitsOnly = mobile.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      triggerToast('error', 'Mobile number must have at least 10 digits.');
      return;
    }
    if (dbUsers.some(u => u.email.toLowerCase() === email)) {
      triggerToast('error', 'This email is already registered. Try signing in instead.');
      return;
    }
    if (dbUsers.some(u => u.mobile.replace(/\D/g, '') === digitsOnly)) {
      triggerToast('error', 'This mobile number is already registered.');
      return;
    }

    let refBy = regRef.trim().toUpperCase() || null;
    if (refBy) {
      const sponsor = dbUsers.find(u => u.refCode.toUpperCase() === refBy);
      if (!sponsor) {
        triggerToast('error', 'Referral code does not exist. Leave blank or check again.');
        return;
      }
      if (sponsor.suspended) {
        triggerToast('error', 'Referral sponsor is suspended.');
        return;
      }
    }

    setOtpLoading(true);
    try {
      await db.auth.sendMagicCode({ email });
      setOtpEmail(email);
      setPendingRegistration({
        fname: regFname.trim(),
        lname: regLname.trim() || 'User',
        email,
        mobile,
        refBy,
      });
      setAuthStep('otp');
      triggerToast('success', `Verification code sent to ${email}. Check your inbox.`);
    } catch (err: any) {
      const msg = err?.body?.message || err?.message || 'Could not send code. Try again.';
      triggerToast('error', msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // STEP 2 — Verify OTP (works for both sign-in and registration)
  const handleVerifyOtp = async () => {
    const code = otpCode.trim();
    if (!code) {
      triggerToast('error', 'Please enter the 6-digit code.');
      return;
    }
    if (!otpEmail) {
      triggerToast('error', 'Session expired. Restart sign-in.');
      resetOtpFlow();
      return;
    }

    setOtpLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email: otpEmail, code });

      // Registration branch
      if (pendingRegistration) {
        const reg = pendingRegistration;
        let newId = 'USR' + Math.floor(1001 + Math.random() * 8999);
        while (dbUsers.some(u => u.refCode === newId)) {
          newId = 'USR' + Math.floor(1001 + Math.random() * 8999);
        }
        const uuidId = toUUID(newId);

        const newUser: User = {
          id: uuidId,
          fname: reg.fname,
          lname: reg.lname,
          email: reg.email,
          pass: '',
          mobile: reg.mobile,
          role: 'user',
          points: 50,
          balance: 2.5,
          totalEarned: 2.5,
          totalWithdrawn: 0,
          tasksCompleted: 0,
          refs: 0,
          suspended: false,
          regDate: new Date().toISOString().split('T')[0],
          refCode: newId,
          refBy: reg.refBy,
        };

        const txs: any[] = [db.tx.users[uuidId].update(newUser)];

        if (reg.refBy) {
          const sponsorUser = dbUsers.find(u => u.refCode.toUpperCase() === reg.refBy);
          if (sponsorUser) {
            txs.push(db.tx.users[sponsorUser.id].update({
              refs: sponsorUser.refs + 1,
              points: sponsorUser.points + 200,
              balance: sponsorUser.balance + 10,
              totalEarned: sponsorUser.totalEarned + 10,
            }));

            const bonusTxId = toUUID('TXN_REF_' + Date.now() + '_' + Math.random().toString(36).substring(7));
            txs.push(db.tx.transactions[bonusTxId].update({
              id: bonusTxId,
              desc: `Referral signup bonus: @${newUser.fname}`,
              type: 'referral',
              amount: 10,
              pts: 200,
              status: 'approved',
              date: new Date().toISOString().split('T')[0],
              dir: 1,
              userId: sponsorUser.id,
            }));
            txs.push(db.tx.transactions[bonusTxId].link({ user: sponsorUser.id }));

            const bonusNotifId = toUUID('NFT_REF_' + Date.now() + '_' + Math.random().toString(36).substring(7));
            txs.push(db.tx.notifications[bonusNotifId].update({
              id: bonusNotifId,
              icon: '🤝',
              msg: `Your referral @${newUser.fname} just joined. +₹10.00 credited.`,
              time: 'Just now',
              userId: sponsorUser.id,
            }));
            txs.push(db.tx.notifications[bonusNotifId].link({ user: sponsorUser.id }));
          }
        }

        await db.transact(txs);
        setSessionUser(newUser);
        setActiveView('dashboard');
        triggerToast('success', `Welcome ${newUser.fname}! 50 points credited.`);

        // Clean register fields
        setRegFname(''); setRegLname(''); setRegEmail('');
        setRegMobile(''); setRegRef('');
        resetOtpFlow();
        return;
      }

      // Sign-in branch
      const found = dbUsers.find(u => u.email.toLowerCase() === otpEmail.toLowerCase());
      if (!found) {
        triggerToast('error', 'Account vanished. Please register again.');
        resetOtpFlow();
        return;
      }
      setSessionUser(found);
      setActiveView('dashboard');
      triggerToast('success', `Welcome back, ${found.fname}!`);
      setLoginEmail('');
      resetOtpFlow();
    } catch (err: any) {
      const msg = err?.body?.message || err?.message || 'Invalid or expired code.';
      triggerToast('error', msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend code without losing pending state
  const handleResendOtp = async () => {
    if (!otpEmail) return;
    setOtpLoading(true);
    try {
      await db.auth.sendMagicCode({ email: otpEmail });
      triggerToast('success', `New code sent to ${otpEmail}.`);
    } catch (err: any) {
      triggerToast('error', err?.body?.message || 'Could not resend code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser = dbUsers.find(u => u.id === toUUID('USR0001'));
    if (demoUser) {
      setSessionUser(demoUser);
      triggerToast('success', 'Logged in as Demo User Rahul Kumar');
      setActiveView('dashboard');
    }
  };

  const handleLogout = () => {
    try { db.auth.signOut(); } catch {}
    setSessionUser(null);
    resetOtpFlow();
    triggerToast('info', 'Logged out successfully!');
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!liveUser) return;
    const txs = [db.tx.users[liveUser.id].update(updates)];

    // If updating check-in state, write an approved transaction log to the audited ledger
    if (updates.lastCheckIn) {
      const txId = toUUID('TXN_CHECKIN_' + Date.now());
      txs.push(db.tx.transactions[txId].update({
        id: txId,
        desc: `Daily Streak Check-in (Day ${updates.streakCount})`,
        type: 'task',
        amount: 1, // Re 1 earned
        pts: 100, // 100 points
        status: 'approved',
        date: new Date().toISOString().split('T')[0],
        dir: 1,
        userId: liveUser.id
      }));
    }

    await db.transact(txs);
  };

  // Process task submissions
  const handleTaskSubmit = async (taskId: string, proofType: 'screenshot' | 'auto', file: File | null, link: string) => {
    if (!liveUser) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Send everything to verification queue
    const subId = toUUID('SUB' + Date.now());
    const newSub: TaskSubmission = {
      id: subId,
      taskId,
      userId: liveUser.id,
      userName: liveUser.fname + ' ' + liveUser.lname,
      proof: file ? `secure.cloudinary.com/earnhub/proof_${liveUser.id}_${file.name}` : (link ? `Input Link: ${link}` : `Auto-Verify System (Wait)`),
      status: 'pending',
      submittedAt: new Date().toLocaleString()
    };

    const txnId = toUUID('TXN' + Date.now());
    const pendingTx: Transaction = {
      id: txnId,
      desc: `${task.title} (Verification Pending)`,
      type: 'task',
      amount: 0,
      pts: task.pts,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      dir: 1,
      taskId,
      userId: liveUser.id
    };

    const completedTaskId = toUUID(`${liveUser.id}_${taskId}`);

    await db.transact([
      db.tx.submissions[subId].update(newSub),
      db.tx.submissions[subId].link({ user: liveUser.id }),
      db.tx.transactions[txnId].update(pendingTx),
      db.tx.transactions[txnId].link({ user: liveUser.id }),
      db.tx.completed_tasks[completedTaskId].update({
        id: completedTaskId,
        userId: liveUser.id,
        taskId: taskId
      }),
      db.tx.completed_tasks[completedTaskId].link({ user: liveUser.id })
    ]);
    
    triggerToast('success', 'Task submitted successfully! Held in verification queues by Admin.');
  };

  const handleCompleteOffer = async (offerId: string) => {
    if (!liveUser) return;
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    // Send Offerwall to verify queue
    const subId = toUUID('SUB' + Date.now());
    const newSub: TaskSubmission = {
      id: subId,
      taskId: offerId,
      userId: liveUser.id,
      userName: liveUser.fname + ' ' + liveUser.lname,
      proof: `Offerwall Network Sync (${offer.network})`,
      status: 'pending',
      submittedAt: new Date().toLocaleString()
    };

    const txnId = toUUID('TXN' + Date.now());
    const pendingTx: Transaction = {
      id: txnId,
      desc: `CPA Completed: ${offer.title} (Verification Pending)`,
      type: 'offer',
      amount: 0,
      pts: offer.pts,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      dir: 1,
      taskId: offerId,
      userId: liveUser.id
    };

    await db.transact([
      db.tx.submissions[subId].update(newSub),
      db.tx.submissions[subId].link({ user: liveUser.id }),
      db.tx.transactions[txnId].update(pendingTx),
      db.tx.transactions[txnId].link({ user: liveUser.id })
    ]);

    triggerToast('info', 'Offer completed and sent to admin verification queue.');
  };

  const getCommissionOperations = (sourceVal: number, originUser: User): any[] => {
    if (!originUser || !originUser.refBy) return [];
    const levels = [0.10, 0.05, 0.02]; // L1 10%, L2 5%, L3 2%
    let sponsorCode = originUser.refBy;
    const commTxs: any[] = [];

    let currentSponsorCode = sponsorCode;
    for (let lvl = 0; lvl < levels.length; lvl++) {
      if (!currentSponsorCode) break;
      const targetSponsor = dbUsers.find(x => x.refCode === currentSponsorCode);
      if (!targetSponsor) break;

      const commission = parseFloat((sourceVal * levels[lvl]).toFixed(2));
      const commPts = Math.round(commission * (systemSettings?.ptsToCashRate || 20));
      
      if (commission > 0) {
        const txId = toUUID('TXN_COMM_' + Date.now() + '_' + lvl + '_' + Math.random().toString(36).substring(7));
        commTxs.push(db.tx.transactions[txId].update({
          id: txId,
          desc: `L${lvl + 1} Commission from @${originUser.fname}`,
          type: 'referral',
          amount: commission,
          pts: commPts,
          status: 'approved',
          date: new Date().toISOString().split('T')[0],
          dir: 1,
          userId: targetSponsor.id
        }));
        commTxs.push(db.tx.transactions[txId].link({ user: targetSponsor.id }));

        const notifId = toUUID('NFT_COMM_' + Date.now() + '_' + lvl + '_' + Math.random().toString(36).substring(7));
        commTxs.push(db.tx.notifications[notifId].update({
          id: notifId,
          icon: '🎁',
          msg: `You received ₹${commission.toFixed(2)} (${commPts} PTS) as L${lvl + 1} Referral Commission from @${originUser.fname}!`,
          time: 'Just now',
          userId: targetSponsor.id
        }));
        commTxs.push(db.tx.notifications[notifId].link({ user: targetSponsor.id }));

        commTxs.push(db.tx.users[targetSponsor.id].update({
          balance: targetSponsor.balance + commission,
          points: targetSponsor.points + commPts,
          totalEarned: targetSponsor.totalEarned + commission
        }));
      }

      currentSponsorCode = targetSponsor.refBy || '';
    }
    return commTxs;
  };

  const handleWithdrawalRequest = async (amount: number, method: string, dest: string) => {
    if (!liveUser) return;

    const reqId = toUUID('WD' + Date.now());
    
    const tx: Transaction = {
      id: reqId,
      desc: `${method} Withdrawal request processed to: ${dest}`,
      type: 'withdraw',
      amount: -amount,
      pts: 0,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      dir: -1,
      userId: liveUser.id
    };

    const wr: WithdrawRequest = {
      id: reqId,
      userId: liveUser.id,
      userName: liveUser.fname + ' ' + liveUser.lname,
      method,
      dest,
      amount,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };

    await db.transact([
      db.tx.users[liveUser.id].update({
        balance: liveUser.balance - amount,
        totalWithdrawn: liveUser.totalWithdrawn + amount
      }),
      db.tx.transactions[tx.id].update(tx),
      db.tx.transactions[tx.id].link({ user: liveUser.id }),
      db.tx.payouts[wr.id].update(wr),
      db.tx.payouts[wr.id].link({ user: liveUser.id })
    ]);

    triggerToast('success', `Withdrawal submitted! Held for standard verification review.`);
  };

  // ─────────────── ADMIN OPERATIONS ───────────────
  const handleApproveProof = async (subId: string) => {
    const sub = submissions.find(s => s.id === subId);
    if (!sub) return;

    const task = (tasks.find(t => t.id === sub.taskId) || offers.find(o => o.id === sub.taskId)) as any;
    if (!task) return;

    const targetUser = dbUsers.find(x => x.id === sub.userId);
    if (!targetUser) return;

    const rewardPts = Math.round(task.pts * (systemSettings?.vipMultiplier || 1.0));
    const txs: any[] = [
      db.tx.users[targetUser.id].update({
        balance: targetUser.balance + task.value,
        points: targetUser.points + rewardPts,
        totalEarned: targetUser.totalEarned + task.value,
        tasksCompleted: targetUser.tasksCompleted + 1
      }),
      db.tx.submissions[subId].update({ status: 'approved' })
    ];

    // Cascade Commission directly inside the same single transaction list
    if (targetUser.refBy) {
      const commissionOperations = getCommissionOperations(task.value, targetUser);
      txs.push(...commissionOperations);
    }

    const pendingTx = transactions.find(tx => tx.taskId === sub.taskId && tx.status === 'pending');
    if (pendingTx) {
      txs.push(db.tx.transactions[pendingTx.id].update({
        status: 'approved',
        amount: task.value,
        pts: rewardPts,
        desc: task.title
      }));
    }

    await db.transact(txs);
    triggerToast('success', 'Proof verified! points and cash values credited to standard earner.');
  };

  const handleRejectProof = async (subId: string) => {
    const sub = submissions.find(s => s.id === subId);
    if (!sub) return;

    const txs = [
      db.tx.submissions[subId].update({ status: 'rejected' })
    ];

    const pendingTx = transactions.find(tx => tx.taskId === sub.taskId && tx.status === 'pending');
    if (pendingTx) {
      txs.push(db.tx.transactions[pendingTx.id].update({
        status: 'rejected',
        desc: `${pendingTx.desc.replace(' (Verification Pending)', '')} (Rejected)`
      }));
    }

    await db.transact(txs);
    triggerToast('info', 'Task submission rejected completely.');
  };

  const handleSuspendUser = async (userId: string) => {
    await db.transact([
      db.tx.users[userId].update({ suspended: true, fraudFlag: false })
    ]);
    triggerToast('success', 'Account block successful. frozen balance.');
  };

  const handleToggleSuspendUser = async (userId: string) => {
    const userToToggle = dbUsers.find(u => u.id === userId);
    if (!userToToggle) return;
    await db.transact([
      db.tx.users[userId].update({ suspended: !userToToggle.suspended })
    ]);
    triggerToast('success', 'User status altered.');
  };

  const handleApprovePayout = async (payId: string) => {
    const request = payouts.find(p => p.id === payId);
    if (!request) return;
    const txs = [db.tx.payouts[payId].update({ status: 'approved' })];

    if (request) {
      const notifId = toUUID('NFT_PAY_APR_' + Date.now());
      txs.push(db.tx.notifications[notifId].update({
        id: notifId,
        icon: '💸',
        msg: `Your withdrawal request of ₹${request.amount.toFixed(2)} via ${request.method} was approved and marked paid! Check your account.`,
        time: 'Just now',
        userId: request.userId
      }));
      txs.push(db.tx.notifications[notifId].link({ user: request.userId }));
    }

    await db.transact(txs);
    triggerToast('success', 'Withdrawal requests payout marked paid!');
  };

  const handleRejectPayout = async (payId: string) => {
    const request = payouts.find(p => p.id === payId);
    if (!request) return;

    const targetUser = dbUsers.find(u => u.id === request.userId);
    if (!targetUser) return;

    const refundAmt = request.amount;
    const refundPts = refundAmt * systemSettings.ptsToCashRate;

    const txId = toUUID('TXN' + Date.now());
    const tx: Transaction = {
      id: txId,
      desc: `Refund for rejected withdrawal request #${payId}`,
      type: 'withdraw',
      amount: request.amount,
      pts: Math.round(refundPts),
      status: 'approved',
      date: new Date().toISOString().split('T')[0],
      dir: 1
    };

    const notifId = toUUID('NFT_PAY_REJ_' + Date.now());

    await db.transact([
      db.tx.users[targetUser.id].update({
        balance: targetUser.balance + refundAmt,
        points: targetUser.points + refundPts
      }),
      db.tx.payouts[payId].update({ status: 'rejected' }),
      db.tx.transactions[txId].update(tx),
      db.tx.notifications[notifId].update({
        id: notifId,
        icon: '❌',
        msg: `Your withdrawal request of ₹${request.amount.toFixed(2)} was rejected. Points (₹${request.amount.toFixed(2)}) refunded/credited back.`,
        time: 'Just now',
        userId: targetUser.id
      }),
      db.tx.notifications[notifId].link({ user: targetUser.id })
    ]);

    triggerToast('success', 'Withdrawal request rejected. Funds returned immediately!');
  };

  const handleUpdateSettings = async (newSettings: SystemSettings) => {
    await db.transact([
      db.tx.system_settings[toUUID('global_settings')].update(newSettings)
    ]);
    triggerToast('success', 'System parameters & toggles updated!');
  };

  const handleUpdateUserFields = async (userId: string, fields: Partial<User>) => {
    await db.transact([
      db.tx.users[userId].update(fields)
    ]);
    triggerToast('success', 'User stats & permissions applied!');
  };

  const handleDeleteUser = async (userId: string) => {
    const runs: any[] = [];
    const targetUuid = toUUID(userId);

    // 1. Delete associated Task_Ledger records
    allTaskLedgerList.forEach(item => {
      if (item.userId === userId || item.userId === targetUuid) {
        runs.push(db.tx.Task_Ledger[item.id].delete());
      }
    });

    // 2. Delete associated transactions
    transactions.forEach(item => {
      if (item.userId === userId || item.userId === targetUuid) {
        runs.push(db.tx.transactions[item.id].delete());
      }
    });

    // 3. Delete associated submissions
    submissions.forEach(item => {
      if (item.userId === userId || item.userId === targetUuid) {
        runs.push(db.tx.submissions[item.id].delete());
      }
    });

    // 4. Delete associated payouts / withdraw requests
    payouts.forEach(item => {
      if (item.userId === userId || item.userId === targetUuid) {
        runs.push(db.tx.payouts[item.id].delete());
      }
    });

    // 5. Delete associated notifications
    allNotificationsList.forEach(item => {
      if (item.userId === userId || item.userId === targetUuid) {
        runs.push(db.tx.notifications[item.id].delete());
      }
    });

    // 6. Delete associated support tickets
    supportTickets.forEach(item => {
      if (item.userId === userId || item.userId === targetUuid) {
        runs.push(db.tx.support_tickets[item.id].delete());
      }
    });

    // 7. Delete associated completed tasks markers
    allCompletedTasksList.forEach(item => {
      if (item.userId === userId || item.userId === targetUuid) {
        runs.push(db.tx.completed_tasks[item.id].delete());
      }
    });

    // 8. Finally delete the user root node
    runs.push(db.tx.users[userId].delete());

    await db.transact(runs);
    triggerToast('success', 'User node completely deleted and all related graph/ledger tables sanitized!');
  };

  const handleResolveTicket = async (ticketId: string, replyMessage: string) => {
    const tkt = supportTickets.find(t => t.id === ticketId);
    if (!tkt) return;

    const notifId = toUUID('NFT' + Date.now());
    await db.transact([
      db.tx.support_tickets[ticketId].update({ status: 'resolved', reply: replyMessage }),
      db.tx.notifications[notifId].update({
        id: notifId,
        icon: '💬',
        msg: `Support reply for ticket #${ticketId}: "${replyMessage}"`,
        time: 'Just now',
        userId: tkt.userId
      }),
      db.tx.notifications[notifId].link({ user: tkt.userId })
    ]);
    triggerToast('success', 'User support problem marked resolved!');
  };

  const handleAddNotification = async (messageText: string) => {
    const notifId = toUUID('NFT' + Date.now());
    const runs = [
      db.tx.notifications[notifId].update({
        id: notifId,
        icon: '📢',
        msg: messageText,
        time: 'Just now'
      })
    ];
    // Link to all active users so they receive this global broadcast
    dbUsers.forEach(u => {
      runs.push(db.tx.notifications[notifId].link({ user: u.id }));
    });
    await db.transact(runs);
    triggerToast('success', 'Global broadcast notification sent to all active members!');
  };

  const handleDismissNotification = async (notifId: string) => {
    try {
      await db.transact([
        db.tx.notifications[notifId].delete()
      ]);
      triggerToast('success', 'Notification dismissed!');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      triggerToast('error', 'Failed to dismiss notification.');
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const runs = notifications.map(n => db.tx.notifications[n.id].delete());
      if (runs.length > 0) {
        await db.transact(runs);
        triggerToast('success', 'All notifications cleared!');
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      triggerToast('error', 'Failed to clear notifications.');
    }
  };

  const handleAddSupportTicket = async (subject: string, message: string) => {
    if (!liveUser) return;
    const ticketId = 'TKT' + Math.floor(100 + Math.random() * 900);
    const uuidId = toUUID(ticketId);
    const newTicket: SupportTicket = {
      id: uuidId,
      userId: liveUser.id,
      userName: `${liveUser.fname} ${liveUser.lname}`,
      userEmail: liveUser.email,
      subject,
      message,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await db.transact([
      db.tx.support_tickets[uuidId].update(newTicket)
    ]);
    triggerToast('success', 'Your ticket has been submitted to Support!');
  };

  const handleLinkSponsor = async (sponsorId: string) => {
    if (!liveUser) return;
    
    // Check if sponsor exists
    const sponsorObj = dbUsers.find(u => u.refCode === sponsorId);
    if (!sponsorObj) {
      triggerToast('error', 'Invalid Sponsor UID');
      return;
    }
    
    await db.transact([
      db.tx.users[liveUser.id].update({ refBy: sponsorId }),
      db.tx.users[sponsorObj.id].update({ refs: sponsorObj.refs + 1 })
    ]);
    
    triggerToast('success', `Linked successfully to sponsor!`);
  };

  const handleAddTask = async (newTask: Task) => {
    const uuidId = toUUID(newTask.id);
    await db.transact([
      db.tx.tasks[uuidId].update({ ...newTask, id: uuidId })
    ]);
    triggerToast('success', `Campaign "${newTask.title}" launched successfully!`);
  };

  const handleDeleteTask = async (taskId: string) => {
    await db.transact([
      db.tx.tasks[toUUID(taskId)].delete()
    ]);
    triggerToast('info', 'Campaign deleted from active listing.');
  };

  const handleAwardReward = async (pts: number, value: number, desc: string) => {
    if (!liveUser) return;
    const txId = toUUID('TXN' + Date.now());
    await db.transact([
      db.tx.users[liveUser.id].update({
        points: liveUser.points + pts,
        balance: liveUser.balance + value,
        totalEarned: liveUser.totalEarned + value
      }),
      db.tx.transactions[txId].update({
        id: txId,
        desc,
        type: 'task',
        amount: value,
        pts: pts,
        status: 'approved',
        date: new Date().toISOString().split('T')[0],
        dir: 1
      })
    ]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f8] flex flex-col antialiased">
      {/* Toast Alert Box */}
      {toastMsg && (
        <div id="toast-banner" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#1f1f2e] border border-white/12 rounded-2xl py-3.5 px-5 shadow-2xl max-w-sm animate-fade-in duration-300">
          <span className="text-lg">
            {toastMsg.type === 'success' ? '✅' : toastMsg.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="text-xs font-semibold text-[#f0f0f8]">{toastMsg.text}</span>
        </div>
      )}

      {/* ──────────────── LANDING SCREEN ──────────────── */}
      {!sessionUser && activeView === 'dashboard' && (
        <div id="landing-screen" className="flex flex-col min-h-screen w-full relative overflow-hidden">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-gradient-to-br from-[#b14dff]/20 via-[#ff4dd2]/10 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full bg-gradient-to-tl from-[#22f5d8]/15 to-transparent blur-3xl" />

          {/* Header */}
          <header className="relative z-10 border-b border-white/[0.06] backdrop-blur-sm bg-[#07041a]/40">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-10 h-16">
              <a href="#" className="flex items-center gap-2 select-none">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b14dff] to-[#ff4dd2] grid place-items-center font-bold text-white text-sm tracking-tighter">E</span>
                <span className="font-semibold text-[15px] tracking-tight text-white">EarnHub</span>
              </a>
              <nav className="hidden md:flex items-center gap-8 text-[13px] text-[#b8a8d4]">
                <a href="#features" className="hover:text-white transition-colors">Features</a>
                <a href="#how" className="hover:text-white transition-colors">How it works</a>
                <a href="#stats" className="hover:text-white transition-colors">Stats</a>
              </nav>
              <div className="flex items-center gap-2">
                <button
                  id="landing-signin-btn"
                  onClick={() => { setAuthMode('login'); setSessionUser({ id: 'any' } as any); }}
                  className="text-[13px] font-medium text-white/85 hover:text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <a
                  id="landing-header-download-btn"
                  href="#download"
                  className="text-[13px] font-semibold text-white px-4 py-2 rounded-lg bg-gradient-to-r from-[#b14dff] to-[#ff4dd2] shadow-[0_4px_20px_-4px_rgba(177,77,255,0.6)] hover:brightness-110 transition-all"
                >
                  Download App
                </a>
              </div>
            </div>
          </header>

          {/* Hero */}
          <section className="relative z-10 max-w-6xl mx-auto w-full px-6 md:px-10 pt-20 md:pt-28 pb-20 md:pb-28">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-medium text-[#b8a8d4]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f5a0]" />
                Trusted by 50,000+ Indian users
              </span>

              <h1 className="font-bold text-white text-4xl md:text-6xl leading-[1.05] tracking-[-0.03em]">
                Earn real cash by
                <br />
                completing simple tasks.
              </h1>

              <p className="text-[15px] md:text-[17px] leading-relaxed text-[#b8a8d4] max-w-xl mx-auto">
                Micro-tasks, CPA offers and a 3-tier referral matrix — built for India.
                Direct UPI payouts. No middlemen.
              </p>

              <div id="download" className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  id="landing-download-apk-btn"
                  href="#"
                  onClick={(e) => { e.preventDefault(); triggerToast('info', 'APK download will be available shortly.'); }}
                  className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#b14dff] to-[#ff4dd2] text-white text-[14px] font-semibold shadow-[0_10px_40px_-8px_rgba(177,77,255,0.6)] hover:shadow-[0_14px_50px_-8px_rgba(177,77,255,0.8)] transition-all min-w-[220px]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.34a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m-11 0a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m11.4-6.05L19.93 5.3a.42.42 0 0 0-.15-.57.42.42 0 0 0-.57.15l-2.04 3.53A12.5 12.5 0 0 0 12 7.5a12.5 12.5 0 0 0-5.17 1.91L4.79 5.88a.42.42 0 0 0-.57-.15.42.42 0 0 0-.15.57l2.01 3.99A11.7 11.7 0 0 0 1.5 18h21a11.7 11.7 0 0 0-4.58-8.71"/></svg>
                  Download Android App
                </a>
                <button
                  id="landing-demo-btn"
                  onClick={handleDemoLogin}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/10 text-[14px] font-medium text-white hover:bg-white/[0.04] hover:border-white/20 transition-all min-w-[180px]"
                >
                  View Live Demo
                </button>
              </div>

              <div className="flex items-center justify-center gap-6 pt-4 text-[12px] text-[#8675a5]">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#00f5a0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  Android 7.0+
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#00f5a0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  Free download
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#00f5a0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  No subscription
                </span>
              </div>
            </div>
          </section>

          {/* Core Features */}
          <section id="features" className="relative z-10 max-w-6xl mx-auto w-full px-6 md:px-10 py-16 md:py-20 border-t border-white/[0.05]">
            <header className="text-center mb-12 md:mb-16 space-y-3">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#ff4dd2]">Why EarnHub</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Built for serious earners.</h2>
              <p className="text-[14px] text-[#b8a8d4] max-w-md mx-auto">Three guarantees that set us apart from every other micro-earning platform in India.</p>
            </header>

            <ul className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <li className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:border-[#b14dff]/30 hover:bg-white/[0.04] transition-all">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#b14dff]/20 to-[#ff4dd2]/10 border border-[#b14dff]/20 grid place-items-center mb-5">
                  <svg className="w-5 h-5 text-[#ff4dd2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2 tracking-tight">Fast Payouts</h3>
                <p className="text-[13.5px] leading-relaxed text-[#b8a8d4]">Withdraw to UPI, USDT TRC20 or BEP20. Most requests clear within minutes — never longer than 12 hours.</p>
              </li>

              <li className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:border-[#22f5d8]/30 hover:bg-white/[0.04] transition-all">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#22f5d8]/20 to-[#4dabff]/10 border border-[#22f5d8]/20 grid place-items-center mb-5">
                  <svg className="w-5 h-5 text-[#22f5d8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2 tracking-tight">Simple Micro-tasks</h3>
                <p className="text-[13.5px] leading-relaxed text-[#b8a8d4]">Watch ads, install apps, take surveys, complete CPA offers. Each task is short, clear and instantly rewarding.</p>
              </li>

              <li className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:border-[#00f5a0]/30 hover:bg-white/[0.04] transition-all">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00f5a0]/20 to-[#22f5d8]/10 border border-[#00f5a0]/20 grid place-items-center mb-5">
                  <svg className="w-5 h-5 text-[#00f5a0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2 tracking-tight">100% Secure</h3>
                <p className="text-[13.5px] leading-relaxed text-[#b8a8d4]">Device fingerprinting, IP-locked sessions and admin-audited payouts. Your earnings are protected end-to-end.</p>
              </li>
            </ul>
          </section>

          {/* How It Works */}
          <section id="how" className="relative z-10 max-w-6xl mx-auto w-full px-6 md:px-10 py-16 md:py-20 border-t border-white/[0.05]">
            <header className="text-center mb-12 md:mb-16 space-y-3">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#22f5d8]">Get Started</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Three steps to your first payout.</h2>
            </header>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
              <li className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-[11px] font-mono font-semibold tracking-[0.2em] text-[#b8a8d4]">STEP 01</span>
                </div>
                <h3 className="text-[18px] font-semibold text-white mb-2 tracking-tight">Download the APK</h3>
                <p className="text-[13.5px] leading-relaxed text-[#b8a8d4]">Get our official Android app directly from this site. No Play Store required, 100% verified signature.</p>
              </li>

              <li className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-[11px] font-mono font-semibold tracking-[0.2em] text-[#b8a8d4]">STEP 02</span>
                </div>
                <h3 className="text-[18px] font-semibold text-white mb-2 tracking-tight">Complete Tasks</h3>
                <p className="text-[13.5px] leading-relaxed text-[#b8a8d4]">Pick from social tasks, app installs, surveys and CPA offers. Earn points and cash for every verified action.</p>
              </li>

              <li className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-[11px] font-mono font-semibold tracking-[0.2em] text-[#b8a8d4]">STEP 03</span>
                </div>
                <h3 className="text-[18px] font-semibold text-white mb-2 tracking-tight">Withdraw to UPI</h3>
                <p className="text-[13.5px] leading-relaxed text-[#b8a8d4]">Once you hit ₹100, request a payout to UPI or USDT. Funds arrive in your account within minutes.</p>
              </li>
            </ol>
          </section>

          {/* Stats */}
          <section id="stats" className="relative z-10 max-w-6xl mx-auto w-full px-6 md:px-10 py-14 md:py-16 border-t border-white/[0.05]">
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
              <div className="bg-[#07041a] p-6 md:p-8">
                <dt className="text-[11px] font-medium text-[#8675a5] uppercase tracking-[0.12em]">Paid out</dt>
                <dd className="mt-2 text-2xl md:text-3xl font-bold text-white tracking-tight">₹42L+</dd>
              </div>
              <div className="bg-[#07041a] p-6 md:p-8">
                <dt className="text-[11px] font-medium text-[#8675a5] uppercase tracking-[0.12em]">Active users</dt>
                <dd className="mt-2 text-2xl md:text-3xl font-bold text-white tracking-tight">50,000+</dd>
              </div>
              <div className="bg-[#07041a] p-6 md:p-8">
                <dt className="text-[11px] font-medium text-[#8675a5] uppercase tracking-[0.12em]">Campaigns</dt>
                <dd className="mt-2 text-2xl md:text-3xl font-bold text-white tracking-tight">1,200+</dd>
              </div>
              <div className="bg-[#07041a] p-6 md:p-8">
                <dt className="text-[11px] font-medium text-[#8675a5] uppercase tracking-[0.12em]">Referral tiers</dt>
                <dd className="mt-2 text-2xl md:text-3xl font-bold text-white tracking-tight">3-Level</dd>
              </div>
            </dl>
          </section>

          {/* Final CTA */}
          <section className="relative z-10 max-w-6xl mx-auto w-full px-6 md:px-10 py-16 md:py-24">
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#b14dff]/[0.08] via-[#ff4dd2]/[0.05] to-transparent p-10 md:p-14 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight max-w-2xl mx-auto leading-[1.15]">
                Start earning in under two minutes.
              </h2>
              <p className="text-[14.5px] text-[#b8a8d4] max-w-md mx-auto">No KYC for first ₹500. No subscription. Just install and earn.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  id="landing-final-download-btn"
                  href="#"
                  onClick={(e) => { e.preventDefault(); triggerToast('info', 'APK download will be available shortly.'); }}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#b14dff] to-[#ff4dd2] text-white text-[14px] font-semibold shadow-[0_10px_40px_-8px_rgba(177,77,255,0.6)] hover:shadow-[0_14px_50px_-8px_rgba(177,77,255,0.8)] transition-all min-w-[220px]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.34a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m-11 0a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m11.4-6.05L19.93 5.3a.42.42 0 0 0-.15-.57.42.42 0 0 0-.57.15l-2.04 3.53A12.5 12.5 0 0 0 12 7.5a12.5 12.5 0 0 0-5.17 1.91L4.79 5.88a.42.42 0 0 0-.57-.15.42.42 0 0 0-.15.57l2.01 3.99A11.7 11.7 0 0 0 1.5 18h21a11.7 11.7 0 0 0-4.58-8.71"/></svg>
                  Download Android App
                </a>
                <button
                  id="landing-final-signin-btn"
                  onClick={() => { setAuthMode('login'); setSessionUser({ id: 'any' } as any); }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/10 text-[14px] font-medium text-white hover:bg-white/[0.04] hover:border-white/20 transition-all min-w-[180px]"
                >
                  Already have an account?
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="relative z-10 border-t border-white/[0.05] mt-auto">
            <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[#b14dff] to-[#ff4dd2] grid place-items-center font-bold text-white text-[11px]">E</span>
                <span className="text-[13px] text-[#b8a8d4]">© 2026 EarnHub. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6 text-[12.5px] text-[#8675a5]">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* ──────────────── AUTH SCREEN — Email OTP ──────────────── */}
      {sessionUser && sessionUser.id === 'any' && (
        <div id="auth-screen" className="flex-1 flex items-center justify-center p-4 py-12 md:py-16">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#1c0a3e]/95 to-[#0d0628]/95 backdrop-blur-xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-[0_20px_80px_-20px_rgba(177,77,255,0.35)]">
            <div className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br from-[#b14dff]/30 to-transparent blur-3xl" />

            {/* Logo */}
            <div className="relative text-center space-y-1.5">
              <div className="inline-flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#b14dff] to-[#ff4dd2] grid place-items-center font-bold text-white text-base">E</span>
                <span className="font-semibold text-[18px] tracking-tight text-white">EarnHub</span>
              </div>
              <p className="text-[12px] text-[#b8a8d4]">
                {authStep === 'email'
                  ? (authMode === 'login' ? 'Sign in with your email' : 'Create your free account')
                  : 'Enter the 6-digit code we just emailed'}
              </p>
            </div>

            {/* Step 1: Email entry (Sign in OR Register) */}
            {authStep === 'email' && (
              <>
                {/* Tab switcher */}
                <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <button
                    id="auth-login-tab"
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 rounded-lg text-[12.5px] font-semibold transition-all ${
                      authMode === 'login'
                        ? 'bg-gradient-to-r from-[#b14dff] to-[#ff4dd2] text-white shadow-[0_4px_16px_-4px_rgba(177,77,255,0.55)]'
                        : 'text-[#b8a8d4] hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    id="auth-register-tab"
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-2 rounded-lg text-[12.5px] font-semibold transition-all ${
                      authMode === 'register'
                        ? 'bg-gradient-to-r from-[#b14dff] to-[#ff4dd2] text-white shadow-[0_4px_16px_-4px_rgba(177,77,255,0.55)]'
                        : 'text-[#b8a8d4] hover:text-white'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {authMode === 'login' ? (
                  <div id="login-form-panel" className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="email-login-input" className="text-[11px] font-medium text-[#b8a8d4] block">Email address</label>
                      <input
                        id="email-login-input"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendSignInOtp(); }}
                        className="w-full bg-[#0d0628]/80 border border-white/[0.08] rounded-xl py-3 px-3.5 text-[13.5px] text-white outline-none placeholder-[#6a5a8a] focus:border-[#b14dff] focus:ring-2 focus:ring-[#b14dff]/15 transition-all"
                      />
                    </div>
                    <button
                      id="process-login-btn"
                      onClick={handleSendSignInOtp}
                      disabled={otpLoading}
                      className="w-full py-3 rounded-xl text-[13.5px] font-semibold text-white bg-gradient-to-r from-[#b14dff] to-[#ff4dd2] shadow-[0_8px_28px_-8px_rgba(177,77,255,0.6)] hover:brightness-110 disabled:opacity-60 transition-all"
                    >
                      {otpLoading ? 'Sending code…' : 'Send verification code'}
                    </button>
                  </div>
                ) : (
                  <div id="register-form-panel" className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="reg-fn-input" className="text-[11px] font-medium text-[#b8a8d4] block">First name</label>
                        <input
                          id="reg-fn-input"
                          type="text"
                          placeholder="Rahul"
                          value={regFname}
                          onChange={(e) => setRegFname(e.target.value)}
                          className="w-full bg-[#0d0628]/80 border border-white/[0.08] rounded-xl py-2.5 px-3 text-[13px] text-white outline-none placeholder-[#6a5a8a] focus:border-[#b14dff] focus:ring-2 focus:ring-[#b14dff]/15 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="reg-ln-input" className="text-[11px] font-medium text-[#b8a8d4] block">Last name</label>
                        <input
                          id="reg-ln-input"
                          type="text"
                          placeholder="Kumar"
                          value={regLname}
                          onChange={(e) => setRegLname(e.target.value)}
                          className="w-full bg-[#0d0628]/80 border border-white/[0.08] rounded-xl py-2.5 px-3 text-[13px] text-white outline-none placeholder-[#6a5a8a] focus:border-[#b14dff] focus:ring-2 focus:ring-[#b14dff]/15 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="reg-email-input" className="text-[11px] font-medium text-[#b8a8d4] block">Email address</label>
                      <input
                        id="reg-email-input"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-[#0d0628]/80 border border-white/[0.08] rounded-xl py-2.5 px-3 text-[13px] text-white outline-none placeholder-[#6a5a8a] focus:border-[#b14dff] focus:ring-2 focus:ring-[#b14dff]/15 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="reg-mobile-input" className="text-[11px] font-medium text-[#b8a8d4] block">Mobile number</label>
                      <input
                        id="reg-mobile-input"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value)}
                        className="w-full bg-[#0d0628]/80 border border-white/[0.08] rounded-xl py-2.5 px-3 text-[13px] text-white outline-none placeholder-[#6a5a8a] focus:border-[#b14dff] focus:ring-2 focus:ring-[#b14dff]/15 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="reg-refcode-input" className="text-[11px] font-medium text-[#b8a8d4] block">Referral code <span className="text-[#6a5a8a] font-normal">(optional)</span></label>
                      <input
                        id="reg-refcode-input"
                        type="text"
                        placeholder="USR0001"
                        value={regRef}
                        onChange={(e) => setRegRef(e.target.value)}
                        className="w-full bg-[#0d0628]/80 border border-white/[0.08] rounded-xl py-2.5 px-3 text-[13px] text-white outline-none placeholder-[#6a5a8a] focus:border-[#b14dff] focus:ring-2 focus:ring-[#b14dff]/15 transition-all"
                      />
                    </div>

                    <button
                      id="process-register-btn"
                      onClick={handleSendRegisterOtp}
                      disabled={otpLoading}
                      className="w-full py-3 rounded-xl text-[13.5px] font-semibold text-white bg-gradient-to-r from-[#b14dff] to-[#ff4dd2] shadow-[0_8px_28px_-8px_rgba(177,77,255,0.6)] hover:brightness-110 disabled:opacity-60 transition-all"
                    >
                      {otpLoading ? 'Sending code…' : 'Send verification code'}
                    </button>

                    <p className="text-[11px] text-[#6a5a8a] text-center leading-relaxed">
                      No password needed. We'll email you a 6-digit code to verify.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Step 2: OTP entry */}
            {authStep === 'otp' && (
              <div id="otp-form-panel" className="space-y-5">
                <div className="rounded-xl border border-[#22f5d8]/20 bg-[#22f5d8]/[0.06] p-3.5 flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-[#22f5d8] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <div className="text-[12px] leading-relaxed">
                    <p className="text-white">Code sent to <span className="font-semibold">{otpEmail}</span></p>
                    <p className="text-[#b8a8d4] mt-0.5">Check your inbox (or spam folder). The code expires in 10 minutes.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="otp-code-input" className="text-[11px] font-medium text-[#b8a8d4] block">6-digit verification code</label>
                  <input
                    id="otp-code-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyOtp(); }}
                    autoFocus
                    className="w-full bg-[#0d0628]/80 border border-white/[0.08] rounded-xl py-3.5 px-4 text-center text-[22px] tracking-[0.6em] font-mono font-semibold text-white outline-none placeholder-[#3a2a5a] focus:border-[#b14dff] focus:ring-2 focus:ring-[#b14dff]/15 transition-all"
                  />
                </div>

                <button
                  id="verify-otp-btn"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || otpCode.length < 6}
                  className="w-full py-3 rounded-xl text-[13.5px] font-semibold text-white bg-gradient-to-r from-[#b14dff] to-[#ff4dd2] shadow-[0_8px_28px_-8px_rgba(177,77,255,0.6)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {otpLoading ? 'Verifying…' : (pendingRegistration ? 'Verify & create account' : 'Verify & sign in')}
                </button>

                <div className="flex items-center justify-between text-[12px]">
                  <button
                    id="resend-otp-btn"
                    onClick={handleResendOtp}
                    disabled={otpLoading}
                    className="text-[#22f5d8] hover:text-white font-medium disabled:opacity-50"
                  >
                    Resend code
                  </button>
                  <button
                    id="change-email-btn"
                    onClick={resetOtpFlow}
                    className="text-[#b8a8d4] hover:text-white font-medium"
                  >
                    ← Change email
                  </button>
                </div>
              </div>
            )}

            {/* Demo + back link */}
            <div className="pt-2 border-t border-white/[0.06] space-y-2.5">
              <button
                id="auth-demo-btn"
                onClick={handleDemoLogin}
                className="w-full py-2.5 rounded-xl border border-white/[0.08] text-[12.5px] font-medium text-white hover:bg-white/[0.04] hover:border-white/15 transition-all"
              >
                Skip — try the demo account
              </button>
              <button
                id="cancel-auth-btn"
                onClick={() => { setSessionUser(null); resetOtpFlow(); }}
                className="w-full text-[11.5px] text-[#6a5a8a] hover:text-[#b8a8d4] transition-colors"
              >
                ← Back to home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── DYNAMIC APPS SHELL PANEL ──────────────── */}
      {sessionUser && sessionUser.id !== 'any' && (
        <div id="app-shell" className="flex-1 flex flex-col md:flex-row min-h-screen relative">
          
          {/* MOBILE TOGGLE HEADER BAR */}
          <div className="md:hidden flex items-center justify-between border-b border-white/5 py-4 px-5 bg-[#111118] sticky top-0 z-40">
            <span className="font-display font-black text-white text-base">
              <span className="text-[#a594ff]">Earn</span>Hub
            </span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setNotifModalOpen(true)}
                className="text-[#9191a8] hover:text-white"
              >
                <Bell className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#9191a8] hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* LEFT INTERACTIVE SIDEBAR */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          <aside className={`fixed md:sticky top-0 left-0 h-[100dvh] w-64 shrink-0 border-r border-white/5 bg-[#111118] z-50 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex-1 flex flex-col pt-6 overflow-y-auto">
              {/* Logo */}
              <div className="px-6 mb-6">
                <span className="font-display font-black text-[#f0f0f8] text-xl block">
                  <span className="text-[#7c6cff]">Earn</span>Hub
                </span>
                <span className="text-[9px] text-[#5a5a72] uppercase tracking-widest mt-0.5 block">Earn · Refer · Withdraw</span>
              </div>

              {/* Navigation Items grouped */}
              <nav className="px-3.5 space-y-6 flex-1">
                {Array.from(new Set(navItems.map(item => item.sec))).map((sec) => (
                  <div key={sec} className="space-y-1.5">
                    <span className="px-3 text-[9px] text-[#5a5a72] font-semibold tracking-widest uppercase block font-display">
                      {sec}
                    </span>
                    <div className="space-y-0.5">
                      {navItems.filter(i => i.sec === sec).map((item) => (
                        <button
                          id={`nav-${item.id}`}
                          key={item.id}
                          onClick={() => {
                            setActiveView(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all ${
                            activeView === item.id
                              ? 'bg-[#7c6cff]/10 text-[#a594ff]'
                              : 'text-[#9191a8] hover:bg-[#16161f] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={`w-4 h-4 ${activeView === item.id ? 'text-[#a594ff]' : 'text-[#9191a8]'}`} />
                            <span className="font-display">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[9px] rounded-full px-2 py-0.5 ${
                              item.id === 'admin' ? 'bg-red-500/20 text-[#ff4f4f]' :
                              'bg-[#7c6cff] text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Logout bottom block */}
            <div className="border-t border-white/5 p-4 bg-[#0a0a0f] space-y-3 shrink-0">
              <div 
                onClick={() => { setActiveView('profile'); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7c6cff] to-[#5aedcc] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                  {sessionUser.fname[0] + sessionUser.lname[0]}
                </div>
                <div className="truncate">
                  <span className="text-xs font-semibold block text-white group-hover:text-[#a594ff] truncate">{sessionUser.fname} {sessionUser.lname}</span>
                  <span className="text-[10px] text-[#3ecf8e] tracking-tight block">₹{sessionUser.balance.toFixed(2)} wallet value</span>
                </div>
              </div>

              <button
                id="btn-logout"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-[#ff4f4f]/10 border border-[#ff4f4f]/25 hover:bg-[#ff4f4f]/15 hover:border-[#ff4f4f]/40 text-[#ff4f4f] py-2.5 rounded-xl text-xs font-bold font-display cursor-pointer select-none transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </aside>

          {/* RIGHT PANELS VIEW */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header top row desk */}
            <header className="hidden md:flex justify-between items-center py-4 px-8 border-b border-white/5 sticky top-0 bg-[#0a0a0f] z-20">
              <span className="font-display font-black text-white text-base capitalize tracking-wide">
                ⛳ {navItems.find(v => v.id === activeView)?.label || activeView}
              </span>
              <div className="flex gap-2">
                {sessionUser && (
                  <div className="bg-[#111118] border border-white/7 rounded-xl px-4 py-2 flex items-center gap-2 mr-2">
                    <span className="text-[#a594ff] font-bold text-xs">₹{sessionUser.balance?.toFixed(2) || '0.00'}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                    <span className="text-[#3ecf8e] font-bold font-mono text-[11px]">{sessionUser.points?.toLocaleString() || 0} PTS</span>
                  </div>
                )}
                <button
                  id="topbar-notif-btn"
                  onClick={() => setNotifModalOpen(true)}
                  className="w-10 h-10 border border-white/7 rounded-xl flex items-center justify-center bg-[#111118] text-[#9191a8] hover:text-white hover:border-[#7c6cff] transition-all cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                  {/* Bonus Points Credit Notification Badges */}
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff4f4f] border-2 border-[#111118] rounded-full animate-pulse" />
                </button>
                <button
                  id="topbar-profile-btn"
                  onClick={() => setActiveView('profile')}
                  className="w-10 h-10 border border-white/7 rounded-xl flex items-center justify-center bg-[#111118] text-[#9191a8] hover:text-white hover:border-[#a594ff] transition-all cursor-pointer"
                >
                  👤
                </button>
              </div>
            </header>

            {/* Admin Announcement Broadcast Banner & Maintenance Alert Block */}
            {liveAnnouncement && (
              <div className="bg-[#7c6cff]/10 border-b border-[#7c6cff]/20 px-4 md:px-8 py-2.5 flex items-center gap-3">
                <span className="text-[#a594ff] text-sm shrink-0">📢</span>
                <div className="text-xs font-semibold text-[#f0f0f8] truncate flex-1">
                  <span className="text-[#a594ff] mr-2 font-bold uppercase tracking-wider text-[10px]">Announcement</span>
                  {liveAnnouncement}
                </div>
              </div>
            )}
            
            {liveMaintenance && (
              <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 md:px-8 py-2.5 flex items-center gap-3">
                <span className="text-orange-400 text-sm shrink-0">⚠️</span>
                <div className="text-xs font-semibold text-[#f0f0f8] truncate flex-1">
                  <span className="text-orange-400 mr-2 font-bold uppercase tracking-wider text-[10px]">System Maintenance</span>
                  Platform operates in limited capacity. Withdrawals are temporarily paused.
                </div>
              </div>
            )}

            {liveMaintenance && sessionUser?.role !== 'admin' ? (
              <main className="p-8 pb-24 md:p-12 flex-1 max-w-6xl w-full mx-auto flex flex-col items-center justify-center text-center">
                <ShieldAlert className="w-24 h-24 text-orange-400 mb-6 drop-shadow-[0_0_20px_rgba(251,146,60,0.5)]" />
                <h1 className="text-3xl font-display font-black text-white mb-2">Maintenance Break</h1>
                <p className="text-[#9191a8] max-w-md">Our servers are undergoing live maintenance. Some features are disabled. Please check back later. Do not refresh.</p>
              </main>
            ) : (
            <main className="p-5 pb-24 md:p-8 flex-1 max-w-6xl w-full mx-auto">
              
              {/* DASHBOARD VIEW Panel */}
              {activeView === 'dashboard' && (
                <div id="panel-dashboard" className="fadeIn space-y-6">
                  {/* Greeting promo */}
                  <div className="bg-gradient-to-r from-[#7c6cff]/15 to-[#5aedcc]/5 border border-[#7c6cff]/20 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Daily Goal Ring */}
                      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 transform drop-shadow-md" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                          <circle cx="50" cy="50" r="40" stroke="#5aedcc" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * Math.min(sessionUser.tasksCompleted / 5, 1))} className="transition-all duration-1000 ease-out" />
                          <circle cx="50" cy="10" r="3" fill="#ff4f4f" /> {/* Visual milestone marker on the 'Daily Goal' SVG ring at the 50% point */}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-white font-display font-black text-lg leading-none tracking-tight">{sessionUser.tasksCompleted}<span className="text-[10px] text-[#9191a8]">/5</span></span>
                          <span className="text-[7px] text-[#5aedcc] uppercase tracking-widest mt-1 font-bold">Daily Goal</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 text-center sm:text-left">
                        <h3 className="font-display font-bold text-[#f0f0f8] text-lg">Welcome back, {sessionUser.fname}.</h3>
                        <p className="text-xs text-[#9191a8]">New tasks are available. Browse the marketplace to start earning.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveView('tasks')}
                      className="bg-[#7c6cff] hover:bg-[#6a5aef] text-white px-6 py-2.5 rounded-xl font-display font-semibold text-xs select-none cursor-pointer transition-all shrink-0"
                    >
                      Browse Tasks →
                    </button>
                  </div>

                  {/* Dynamic Custom Banner Ads */}
                  {systemSettings.promoBanners && systemSettings.promoBanners.filter(b => b.active).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="user-custom-promo-banners">
                      {systemSettings.promoBanners.filter(b => b.active).map((banner) => (
                        <div
                          key={banner.id}
                          className={`bg-gradient-to-r ${banner.bgGradient} border ${banner.borderColor} p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[145px] hover:border-white/20 transition-all duration-300`}
                        >
                          <div className="space-y-1.5 relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                              {banner.badge && (
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${banner.badgeBg}`}>
                                  {banner.badge}
                                </span>
                              )}
                              <span className="text-[9px] text-[#9191a8] uppercase tracking-wider font-semibold">Special Promotion</span>
                            </div>
                            <h4 className="text-xs md:text-sm font-bold text-white font-display tracking-tight">{banner.title}</h4>
                            {banner.subtitle && <p className="text-[10px] md:text-xs text-[#d0d0e0] leading-relaxed line-clamp-2">{banner.subtitle}</p>}
                          </div>
                          
                          {banner.actionUrl && (
                            <div className="pt-3 relative z-10 self-start">
                              {banner.actionUrl.startsWith('http') || banner.actionUrl.startsWith('https') ? (
                                <a
                                  href={banner.actionUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-[#a594ff] hover:text-[#7c6cff] bg-[#7c6cff]/10 hover:bg-[#7c6cff]/20 px-3 py-1.5 rounded-lg border border-[#7c6cff]/20 transition-all duration-200 inline-block cursor-pointer"
                                >
                                  {banner.actionText || 'Browse Ad Offer →'}
                                </a>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (banner.actionUrl === 'offers' || banner.actionUrl === 'tasks' || banner.actionUrl === 'profile' || banner.actionUrl === 'referrals') {
                                      setActiveView(banner.actionUrl);
                                    } else {
                                      setActiveView('tasks');
                                    }
                                  }}
                                  className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-[#a594ff] hover:text-[#7c6cff] bg-[#7c6cff]/10 hover:bg-[#7c6cff]/20 px-3 py-1.5 rounded-lg border border-[#7c6cff]/20 transition-all duration-200 inline-block cursor-pointer"
                                >
                                  {banner.actionText || 'Explore Event →'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {systemSettings.promoActive && (
                    <div id="dynamic-announcement-billboard" className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-orange-500/20 p-5 rounded-3xl flex items-start gap-4 animate-pulse">
                      <span className="text-2xl select-none leading-none pt-0.5">📢</span>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider">{systemSettings.promoTitle || 'System Announcement'}</h4>
                        <p className="text-xs text-[#d0d0e0] leading-relaxed">{systemSettings.promoText || 'Stay tuned for premium rewards!'}</p>
                      </div>
                    </div>
                  )}

                  {/* PDF Tools dashboard card removed */}

                  {/* Account Overview */}
                  <div className="space-y-3">
                    <h4 className="font-display font-semibold text-sm text-[#f0f0f8]">Account Overview</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { l: 'Wallet Balance', v: `₹${sessionUser.balance.toFixed(2)}`, s: 'Available to withdraw', icon: '💰', border: 'border-[#3ecf8e]/20', bg: 'bg-[#3ecf8e]/5' },
                        { l: 'Points', v: sessionUser.points.toLocaleString(), s: `${systemSettings.ptsToCashRate} pts = ₹1`, icon: '⚡', border: 'border-[#5aedcc]/20', bg: 'bg-[#5aedcc]/5' },
                        { l: 'Referrals', v: String(sessionUser.refs), s: '3-tier network', icon: '🌐', border: 'border-[#7c6cff]/20', bg: 'bg-[#7c6cff]/5' },
                        { l: 'Tasks Completed', v: String(sessionUser.tasksCompleted), s: 'Lifetime total', icon: '✓', border: 'border-[#a594ff]/20', bg: 'bg-[#a594ff]/5' }
                      ].map((item, index) => (
                        <div key={index} className={`bg-[#1a1a24] border ${item.border} ${item.bg} rounded-xl p-5 space-y-3`}>
                          <div className="text-2xl">{item.icon}</div>
                          <div>
                            <span className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-display leading-tight">{item.l}</span>
                            <span className="font-display font-black text-white text-xl block pt-1">{item.v}</span>
                          </div>
                          <span className="text-[10px] text-white/50">{item.s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SVG Chart + activities panels */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* SVG Analytics Chart */}
                    <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-display font-semibold text-sm text-white">Earnings This Week</h4>
                        <span className="text-[10px] text-[#5a5a72] font-medium">Last 7 days</span>
                      </div>
                      
                      {/* SVG representation of grid charts */}
                      <div className="w-full h-44 relative bg-[#16161f] rounded-xl border border-white/5 flex items-end justify-between p-4 px-6 overflow-hidden">
                        {[
                          { val: 24, h: 'h-[30%]', day: 'Mon' },
                          { val: 38, h: 'h-[50%]', day: 'Tue' },
                          { val: 12, h: 'h-[20%]', day: 'Wed' },
                          { val: 55, h: 'h-[75%]', day: 'Thu' },
                          { val: 40, h: 'h-[60%]', day: 'Fri' },
                          { val: 75, h: 'h-[95%]', day: 'Sat' },
                          { val: 48, h: 'h-[68%]', day: 'Sun' }
                        ].map((b, bidx) => (
                          <div key={bidx} className="flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                            <span className="text-[9px] text-[#a594ff] font-bold opacity-0 group-hover:opacity-100 transition-opacity">₹{b.val}</span>
                            <div className={`${b.h} w-7 bg-[#7c6cff]/30 group-hover:bg-[#7c6cff] rounded-t-lg transition-all duration-300`} />
                            <span className="text-[9px] text-[#5a5a72] block">{b.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick transactional feed */}
                    <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-3.5">
                      <h4 className="font-display font-semibold text-sm text-white">Recent Activity</h4>
                      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                        {transactions.slice(0, 4).map((tx, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <div className="flex gap-2.5 items-center">
                              <span className="text-xl">
                                {tx.type === 'task' ? '✅' : tx.type === 'referral' ? '🌐' : tx.type === 'offer' ? '💎' : '💸'}
                              </span>
                              <div>
                                <span className="text-xs font-semibold text-white block leading-tight">{tx.desc}</span>
                                <span className="text-[9px] text-[#5a5a72] block pt-0.5">{tx.date}</span>
                              </div>
                            </div>
                            <span className={`font-display text-xs font-bold ${tx.dir === 1 ? 'text-[#3ecf8e]' : 'text-[#ff4f4f]'}`}>
                              {tx.dir === 1 ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Marketplace Quick Carousel */}
                  <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-display font-bold text-sm text-white">Recommended Campaigns</h4>
                      <button
                        onClick={() => setActiveView('tasks')}
                        className="text-xs text-[#a594ff] hover:underline cursor-pointer"
                      >
                        Browse all
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {tasks.filter(t => !completedTasks.includes(t.id)).slice(0, 3).map(t => (
                        <div key={t.id} className="bg-[#16161f] border border-white/5 rounded-xl p-4 flex justify-between items-start gap-4">
                          <div className="space-y-2">
                            <span className="text-2xl">{t.icon}</span>
                            <div>
                              <h5 className="text-[11px] text-white font-bold">{t.title}</h5>
                              <p className="text-[9px] text-[#9191a8] truncate max-w-[150px] mt-0.5">{t.desc}</p>
                            </div>
                          </div>
                          <button
                            id={`btn-dash-start-${t.id}`}
                            onClick={() => setActiveView('tasks')}
                            className="bg-[#7c6cff] text-white p-2 rounded-lg text-[9px] font-bold tracking-wider capitalize select-none cursor-pointer"
                          >
                            Browse
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Referral Leaders Panel */}
                  <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        Referral Leaders
                      </h4>
                      <div className="text-[10px] text-[#3ecf8e] bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 px-2 py-0.5 rounded-full font-bold tracking-wider">
                        LIVE RANKINGS
                      </div>
                    </div>
                    
                    <div className="space-y-2.5">
                      {[...dbUsers].filter(u => u.refs > 0 && !u.fraudFlag).sort((a, b) => b.refs - a.refs).slice(0, 5).map((u, idx) => {
                        const isFirst = idx === 0;
                        const isSecond = idx === 1;
                        const isThird = idx === 2;
                        
                        let rankColor = 'text-[#7c6cff]';
                        let rowBg = 'bg-[#16161f] border-white/5';
                        
                        if (isFirst) {
                          rankColor = 'text-amber-400';
                          rowBg = 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20';
                        } else if (isSecond) {
                          rankColor = 'text-gray-300';
                          rowBg = 'bg-gradient-to-r from-gray-400/10 to-transparent border-gray-400/20';
                        } else if (isThird) {
                          rankColor = 'text-orange-400';
                          rowBg = 'bg-gradient-to-r from-orange-400/10 to-transparent border-orange-400/20';
                        }
                        
                        return (
                          <div key={u.id} className={`p-3 rounded-xl border flex items-center justify-between ${rowBg}`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-6 text-center font-display font-black text-xl ${rankColor}`}>#{idx + 1}</div>
                              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold border border-white/10 shrink-0">
                                {u.fname.charAt(0)}{u.lname.charAt(0)}
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                                  {u.fname} {u.lname}
                                  {isFirst && <span className="text-xs">👑</span>}
                                </h5>
                                <span className="text-[10px] text-[#9191a8]">Ranked #{idx + 1} Globally</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-display font-black text-white">{u.refs} <span className="text-[10px] text-[#5a5a72] font-normal tracking-wider">REFS</span></span>
                              <span className="text-[10px] text-[#3ecf8e] block font-bold">+{u.refs * 200} pts passive</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {[...dbUsers].filter(u => u.refs > 0 && !u.fraudFlag).length === 0 && (
                        <div className="p-8 text-center border border-white/5 rounded-xl bg-[#16161f]">
                          <p className="text-xs text-[#5a5a72]">No referral leaders yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TASK MARKETPLACE TAB VIEW */}
              {activeView === 'tasks' && (
                <Suspense fallback={<TabLoadingPlaceholder />}>
                  <TaskMarketplace 
                    tasks={tasks}
                    completedTasks={completedTasks}
                    onSubmitTask={handleTaskSubmit}
                    userId={sessionUser.id}
                    submissions={submissions.filter(s => s.userId === sessionUser.id)}
                  />
                </Suspense>
              )}

              {/* CPA OFFERWALL TAB VIEW */}
              {activeView === 'offerwall' && (
                <Suspense fallback={<TabLoadingPlaceholder />}>
                  <Offerwall userId={sessionUser.id} />
                </Suspense>
              )}

              {/* MY WALLET TAB VIEW */}
              {activeView === 'wallet' && (
                <Suspense fallback={<TabLoadingPlaceholder />}>
                  <WalletView 
                    user={sessionUser}
                    transactions={transactions}
                    payouts={payouts.filter(p => p.userId === sessionUser.id)}
                    onWithdraw={handleWithdrawalRequest}
                    toast={triggerToast}
                    systemSettings={systemSettings}
                  />
                </Suspense>
              )}

              {/* REFERRAL TAB VIEW */}
              {activeView === 'referral' && (
                <Suspense fallback={<TabLoadingPlaceholder />}>
                  <ReferralTab 
                    user={sessionUser}
                    referrals={referrals}
                    toast={triggerToast}
                    onLinkSponsor={handleLinkSponsor}
                  />
                </Suspense>
              )}

              {/* SUPPORT HELP DESK VIEW */}
              {activeView === 'support' && sessionUser && (
                <div id="panel-support" className="fadeIn space-y-6">
                  <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-2">
                    <h3 className="font-display font-extrabold text-[#f0f0f8] text-lg flex items-center gap-2">
                      <span>🎟️ Support Help Desk</span>
                    </h3>
                    <p className="text-xs text-[#9191a8]">Submit a ticket describing any issues you encounter, such as missing task points or wallet withdrawal queries. Staff will respond promptly.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left side: ticket creation form */}
                    <div className="lg:col-span-2 bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4">
                      <h4 className="font-display font-bold text-sm text-[#f0f0f8]">Create Support Ticket</h4>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const subjectInput = (e.currentTarget.elements.namedItem('tkt_sub') as HTMLInputElement).value;
                        const messageInput = (e.currentTarget.elements.namedItem('tkt_msg') as HTMLTextAreaElement).value;
                        if (!subjectInput.trim() || !messageInput.trim()) return;
                        handleAddSupportTicket(subjectInput, messageInput);
                        e.currentTarget.reset();
                      }} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#9191a8] uppercase font-bold font-mono tracking-wider block">Subject / Issue Category</label>
                          <input 
                            name="tkt_sub"
                            type="text"
                            required
                            placeholder="e.g. Micro task proof reward issue"
                            className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] placeholder-white/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#9191a8] uppercase font-bold font-mono tracking-wider block">Detailed explanation</label>
                          <textarea 
                            name="tkt_msg"
                            rows={4}
                            required
                            placeholder="State exactly what went wrong and mention task names or times..."
                            className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] resize-none placeholder-white/20"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-[#7c6cff] hover:bg-[#6857f3] text-white py-2.5 rounded-xl font-display font-bold text-xs select-none transition-all cursor-pointer"
                        >
                          Submit Ticket
                        </button>
                      </form>
                    </div>

                    {/* Right side: past tickets lists */}
                    <div className="lg:col-span-3 bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4">
                      <h4 className="font-display font-bold text-sm text-[#f0f0f8]">Your Ticket History</h4>
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {supportTickets.filter(t => t.userId === sessionUser.id).length === 0 ? (
                          <div className="text-center py-12 text-xs text-[#5a5a72]">
                            You have not submitted any support tickets yet.
                          </div>
                        ) : (
                          supportTickets.filter(t => t.userId === sessionUser.id).map(t => (
                            <div key={t.id} className="bg-[#16161f] border border-white/5 rounded-xl p-4 space-y-2">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <span className="text-[9px] text-[#7c6cff] font-mono block font-bold">TICKET #{t.id}</span>
                                  <h5 className="text-xs font-bold text-white mt-0.5">{t.subject}</h5>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  t.status === 'resolved' ? 'bg-[#3ecf8e]/12 text-[#3ecf8e] border border-[#3ecf8e]/10' : 'bg-orange-500/12 text-[#ffa94d] border border-orange-500/10'
                                }`}>
                                  {t.status === 'resolved' ? 'Resolved' : 'Pending'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#9191a8] leading-relaxed select-all">{t.message}</p>
                              {t.reply && (
                                <div className="bg-[#7c6cff]/5 border-l-2 border-[#7c6cff] p-2.5 rounded-r-lg space-y-1">
                                  <span className="text-[10px] text-[#a594ff] font-bold block">Support Agent Response:</span>
                                  <p className="text-[11px] text-[#d0d0e0] italic">"{t.reply}"</p>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MY PROFILE TAB VIEW */}
              {activeView === 'profile' && (
                <Suspense fallback={<TabLoadingPlaceholder />}>
                  <ProfileTab 
                    user={sessionUser}
                    onUpdateProfile={handleUpdateProfile}
                    toast={triggerToast}
                  />
                </Suspense>
              )}

              {/* ADMIN CONTROL FOR MANAGER TABS */}
              {activeView.startsWith('admin-') && sessionUser?.role === 'admin' && (
                <Suspense fallback={<TabLoadingPlaceholder />}>
                  <AdminPanel 
                    forceActiveTab={activeView.replace('admin-', '')}
                    users={dbUsers}
                    tasks={tasks}
                    submissions={submissions}
                    payouts={payouts}
                    transactions={transactions}
                    onApproveProof={handleApproveProof}
                    onRejectProof={handleRejectProof}
                    onSuspendUser={handleSuspendUser}
                    onApprovePayout={handleApprovePayout}
                    onToggleSuspendUser={handleToggleSuspendUser}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    sessionUser={sessionUser}
                    systemSettings={systemSettings}
                    onUpdateSettings={handleUpdateSettings}
                    onUpdateUserFields={handleUpdateUserFields}
                    onRejectPayout={handleRejectPayout}
                    supportTickets={supportTickets}
                    onResolveTicket={handleResolveTicket}
                    cpaConversions={dbData?.cpaConversions || []}
                    onAddNotification={handleAddNotification}
                    onDeleteUser={handleDeleteUser}
                  />
                </Suspense>
              )}

              {/* ADMIN CONTROL PANEL TAB VIEW */}
              {activeView === 'admin-control' && sessionUser?.role === 'admin' && (
                <Suspense fallback={<TabLoadingPlaceholder />}>
                  <AdminControlPanel />
                </Suspense>
              )}

              {/* PDF Tools tab view removed */}

            </main>
            )}

            {/* MOBILE FIXED BOTTOM NAVIGATION */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a0a0f]/85 backdrop-blur-xl border-t border-white/10 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              <div className="flex justify-around items-center px-1 py-1 sm:px-4">
                {(sessionUser?.role === 'admin' ? [
                  { id: 'admin-analytics', icon: Home, label: 'Home' },
                  { id: 'admin-payouts', icon: Wallet, label: 'Payments' },
                  { id: 'admin-offers', icon: Briefcase, label: 'Tasks' },
                  { id: 'profile', icon: UserIcon, label: 'Profile' }
                ] : [
                  { id: 'dashboard', icon: Home, label: 'Home' },
                  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
                  { id: 'wallet', icon: Wallet, label: 'Wallet' },
                  { id: 'referral', icon: Users, label: 'Referrals' },
                  { id: 'profile', icon: UserIcon, label: 'Profile' }
                ]).map((item) => {
                  const isActive = activeView === item.id || (item.id === 'wallet' && activeView.startsWith('admin-payouts'));
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`flex flex-col items-center justify-center gap-1 min-w-[76px] min-h-[64px] rounded-2xl transition-all cursor-pointer ${
                        isActive
                          ? 'text-[#a594ff]'
                          : 'text-[#9191a8] hover:text-[#f0f0f8] hover:bg-white/5'
                      }`}
                    >
                      <div className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_10px_rgba(165,148,255,0.8)] text-[#a594ff]' : ''}`}>
                        <item.icon className="w-5 h-5 mx-auto" strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span className={`text-[10px] sm:text-[11px] font-bold tracking-wide font-display transition-colors ${isActive ? 'text-[#a594ff]' : 'text-[#7a7a92]'}`}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* ──────────────── NOTIFICATIONS POP MODAL DIALOG ──────────────── */}
      {notifModalOpen && (
        <div id="notif-modal-backdrop" className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1f2e] border border-white/10 rounded-3xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-[#f0f0f8] text-base">🔔 Notifications</h3>
                {notifications.length > 0 && (
                  <span className="text-[10px] bg-[#7c6cff]/20 text-[#a594ff] px-2 py-0.5 rounded-full font-mono font-bold">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAllNotifications}
                    className="text-[11px] text-[#ff5a5a] hover:text-[#ff7676] bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded-md font-medium transition-all"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  id="close-notif-modal-btn"
                  onClick={() => setNotifModalOpen(false)}
                  className="text-[#9191a8] hover:text-[#f0f0f8] text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="space-y-2.5 divide-y divide-white/5 max-h-[50vh] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="text-3xl text-[#a594ff] animate-bounce">🎉</div>
                  <p className="text-xs text-[#f0f0f8] font-semibold">No notifications left</p>
                  <p className="text-[10px] text-[#9191a8]">You are completely caught up!</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div key={n.id || i} className="flex gap-3 py-3 items-center justify-between first:pt-0 group">
                    <div className="flex gap-3 items-start max-w-[85%]">
                      <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                      <div>
                        <p className="text-xs text-[#f0f0f8] leading-tight font-medium pr-1">{n.msg}</p>
                        <span className="text-[9px] text-[#5a5a72] block mt-1">{n.time}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismissNotification(n.id)}
                      className="text-[10px] text-[#9191a8] hover:text-[#ff5a5a] bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 md:opacity-0"
                      title="Dismiss alert"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── LIVE CHATBOT ASSISTANCE OVERLAY ──────────────── */}
      {sessionUser && (
        <>
          <button
            onClick={() => setSupportBotOpen(prev => !prev)}
            className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 bg-gradient-to-r from-[#7c6cff] to-[#a594ff] rounded-full shadow-[0_0_20px_rgba(124,108,255,0.4)] flex items-center justify-center text-2xl hover:scale-110 transition-transform z-40"
          >
            💬
          </button>
          
          {supportBotOpen && (
             <div className="fixed bottom-40 md:bottom-24 right-6 w-85 bg-[#1f1f2e] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col h-112 animate-in slide-in-from-bottom-5">
               <div className="bg-[#111118] border-b border-white/5 p-4 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-[#7c6cff]/20 flex items-center justify-center text-sm font-bold text-[#a594ff]">🤖</div>
                   <div>
                     <h4 className="text-sm font-bold text-white leading-tight">Support Bot</h4>
                     <span className="text-[10px] text-[#3ecf8e] flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]"></div>Online</span>
                   </div>
                 </div>
                 <button onClick={() => setSupportBotOpen(false)} className="text-[#9191a8] hover:text-white cursor-pointer hover:scale-110 transition-transform">✕</button>
               </div>
               
               <div className="flex-1 overflow-hidden">
                 <Suspense fallback={
                   <div className="flex items-center justify-center h-full text-xs text-[#9191a8] bg-[#1a1a24]">
                     <span>Loading Assistant Engine...</span>
                   </div>
                 }>
                   <HelpChatbot user={sessionUser} onClose={() => setSupportBotOpen(false)} />
                 </Suspense>
               </div>
             </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Ban, RefreshCw, Layers, DollarSign, Home, Wrench, Megaphone, LifeBuoy, Trash2, PlusCircle, MinusCircle, Globe, TrendingUp } from 'lucide-react';
import { User, Task, TaskSubmission, WithdrawRequest, Transaction, SystemSettings, SupportTicket, PromoBannerAd, CpaConversion } from '../types';

interface AdminPanelProps {
  users: User[];
  tasks: Task[];
  submissions: TaskSubmission[];
  payouts: WithdrawRequest[];
  transactions: Transaction[];
  onApproveProof: (subId: string) => void;
  onRejectProof: (subId: string) => void;
  onSuspendUser: (userId: string) => void;
  onApprovePayout: (payoutId: string) => void;
  onToggleSuspendUser: (userId: string) => void;
  onAddTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  sessionUser?: User | null;
  systemSettings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  onUpdateUserFields: (userId: string, fields: Partial<User>) => void;
  onRejectPayout: (payoutId: string) => void;
  supportTickets?: SupportTicket[];
  onResolveTicket?: (ticketId: string, replyMessage: string) => void;
  cpaConversions?: CpaConversion[];
  onAddNotification?: (payload: {
    message: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    linkUrl?: string;
    icon?: string;
  }) => void;
  onDeleteUser?: (userId: string) => void;
  forceActiveTab?: string;
}

export default function AdminPanel({
  users,
  tasks,
  submissions,
  payouts,
  transactions = [],
  onApproveProof,
  onRejectProof,
  onSuspendUser,
  onApprovePayout,
  onToggleSuspendUser,
  onAddTask,
  onDeleteTask,
  sessionUser,
  systemSettings,
  onUpdateSettings,
  onUpdateUserFields,
  onRejectPayout,
  supportTickets = [],
  onResolveTicket,
  cpaConversions = [],
  onAddNotification,
  onDeleteUser,
  forceActiveTab
}: AdminPanelProps) {
  if (!sessionUser || sessionUser.role !== 'admin') {
    return (
      <div id="admin-access-denied" className="bg-[#1a1a24] border border-red-500/20 text-center p-12 rounded-2xl space-y-4 max-w-md mx-auto my-12">
        <span className="text-5xl block">🚫</span>
        <h2 className="text-lg font-bold text-red-400 font-display">Access Denied</h2>
        <p className="text-xs text-[#9191a8] leading-relaxed">
          You must be logged in with administrative privileges to access this workspace.
        </p>
      </div>
    );
  }

  const [bottomTab, setBottomTab] = useState<'home' | 'manage' | 'promot' | 'help'>('home');
  const [activeTab, setActiveTab] = useState<'proofs' | 'offers' | 'users' | 'fraud' | 'payouts' | 'analytics' | 'settings' | 'admin-promos' | 'cpa'>('analytics');
  const [promoTitle, setPromoTitle] = useState(systemSettings.promoTitle || '⚡ SPECIAL OFFER FOR USERS!');
  const [promoText, setPromoText] = useState(systemSettings.promoText || 'Double points activated on all mobile app campaigns for the next 24 hours!');
  const [promoActive, setPromoActive] = useState(!!systemSettings.promoActive);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifMediaUrl, setNotifMediaUrl] = useState('');
  const [notifMediaType, setNotifMediaType] = useState<'auto' | 'image' | 'video'>('auto');
  const [notifLinkUrl, setNotifLinkUrl] = useState('');
  const [notifIcon, setNotifIcon] = useState('📢');
  const [notifUploadPreview, setNotifUploadPreview] = useState<string>('');
  const [ticketReplyText, setTicketReplyText] = useState<Record<string, string>>({});
  const [hoveredBarId, setHoveredBarId] = useState<string | null>(null);

  React.useEffect(() => {
    if (forceActiveTab) {
      if (forceActiveTab === 'analytics') {
        setBottomTab('home');
        setActiveTab('analytics');
      } else {
        setBottomTab('manage');
        setActiveTab(forceActiveTab as any);
      }
    }
  }, [forceActiveTab]);

  // Sync state when systemSettings prop shifts or initializes
  React.useEffect(() => {
    if (systemSettings) {
      setFormPtsToCash(systemSettings.ptsToCashRate ?? 20);
      setFormMinWithdraw(systemSettings.minWithdrawal ?? 100);
      setFormSignupBonus(systemSettings.signupBonus ?? 100);
      setFormVipMultiplier(systemSettings.vipMultiplier ?? 1);
      setFormDisableOffer(!!systemSettings.disableOfferwall);
      setFormDisableTasks(!!systemSettings.disableTasks);
      setFormDisableRefs(!!systemSettings.disableReferrals);
      setPromoTitle(systemSettings.promoTitle || '⚡ SPECIAL OFFER FOR USERS!');
      setPromoText(systemSettings.promoText || 'Double points activated on all mobile app campaigns for the next 24 hours!');
      setPromoActive(!!systemSettings.promoActive);
    }
  }, [systemSettings]);

  // States for Editing a Selected User
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPoints, setEditPoints] = useState<number>(0);
  const [editBalance, setEditBalance] = useState<number>(0);
  const [editRefs, setEditRefs] = useState<number>(0);
  const [editTasksCompleted, setEditTasksCompleted] = useState<number>(0);
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editFname, setEditFname] = useState<string>('');
  const [editLname, setEditLname] = useState<string>('');
  const [editRefBy, setEditRefBy] = useState<string>('');

  // States for System settings form inside Settings tab
  const [formPtsToCash, setFormPtsToCash] = useState<number>(systemSettings?.ptsToCashRate || 20);
  const [formMinWithdraw, setFormMinWithdraw] = useState<number>(systemSettings?.minWithdrawal || 100);
  const [formSignupBonus, setFormSignupBonus] = useState<number>(systemSettings?.signupBonus || 100);
  const [formVipMultiplier, setFormVipMultiplier] = useState<number>(systemSettings?.vipMultiplier || 1);
  const [formDisableOffer, setFormDisableOffer] = useState<boolean>(systemSettings?.disableOfferwall || false);
  const [formDisableTasks, setFormDisableTasks] = useState<boolean>(systemSettings?.disableTasks || false);
  const [formDisableRefs, setFormDisableRefs] = useState<boolean>(systemSettings?.disableReferrals || false);

  // States for new promo banner ads
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerBadge, setNewBannerBadge] = useState('');
  const [newBannerBgPreset, setNewBannerBgPreset] = useState('purple');
  const [newBannerActionUrl, setNewBannerActionUrl] = useState('');
  const [newBannerActionText, setNewBannerActionText] = useState('');
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // (PDF tools metadata & ranking removed)
  const totalToolExecutions = 0;

  // New task form state variables
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPts, setNewPts] = useState(100);
  const [newType, setNewType] = useState<'social' | 'app' | 'survey'>('social');
  const [newStatus, setNewStatus] = useState<'open' | 'hot'>('open');
  const [newProof, setNewProof] = useState<'screenshot' | 'auto'>('screenshot');
  const [newIcon, setNewIcon] = useState('📋');

  const pendingProofs = submissions.filter(s => s.status === 'pending');
  const flaggedUsers = users.filter(u => u.fraudFlag || u.tasksCompleted > 150);
  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const standardUsers = users.filter(u => u.role !== 'admin');

  // Dynamic Fingerprint Collisions computation
  const realCollisions = React.useMemo(() => {
    const ipGroups: Record<string, User[]> = {};
    users.forEach(u => {
      if (u.lastIp && u.role !== 'admin') {
        const ipKey = u.lastIp;
        if (!ipGroups[ipKey]) {
          ipGroups[ipKey] = [];
        }
        ipGroups[ipKey].push(u);
      }
    });

    return Object.entries(ipGroups)
      .filter(([_, groupUsers]) => groupUsers.length > 1)
      .map(([ip, groupUsers]) => {
        const allSuspended = groupUsers.every(u => u.suspended);
        // Identify if they also share the browser signature userAgent
        const firstUa = groupUsers[0].userAgent;
        const uniformUa = groupUsers.every(u => u.userAgent === firstUa);
        const matchPct = uniformUa ? "100% (Identical IP & User-Agent)" : "85% (Identical IP, Different Browsers)";
        return {
          ip,
          users: groupUsers,
          matchStrength: matchPct,
          allSuspended
        };
      });
  }, [users]);

  const handleBanCluster = (clusterUsers: User[]) => {
    clusterUsers.forEach(u => {
      if (!u.suspended) {
        onSuspendUser(u.id);
      }
    });
  };

  // Compute popularity of tasks from the transactions list
  const taskCompletionsData = React.useMemo(() => {
    const counts: Record<string, { count: number; approved: number; pending: number }> = {};
    
    // Scan all transactions for 'task' completions
    transactions.forEach(tx => {
      if (tx.type === 'task' && tx.taskId) {
        if (!counts[tx.taskId]) {
          counts[tx.taskId] = { count: 0, approved: 0, pending: 0 };
        }
        counts[tx.taskId].count += 1;
        if (tx.status === 'approved') {
          counts[tx.taskId].approved += 1;
        } else if (tx.status === 'pending') {
          counts[tx.taskId].pending += 1;
        }
      }
    });

    // Convert keys to array and join with tasks metadata
    const result = Object.entries(counts).map(([taskId, stats]) => {
      const taskObj = tasks.find(t => t.id === taskId);
      return {
        id: taskId,
        title: taskObj ? taskObj.title : `Task ${taskId}`,
        icon: taskObj ? taskObj.icon : '📋',
        pts: taskObj ? taskObj.pts : 0,
        type: taskObj ? taskObj.type : 'social',
        value: taskObj ? taskObj.value : 0,
        ...stats
      };
    });

    // Default seed fallback if transactions list doesn't have any task entries
    if (result.length === 0) {
      return [
        { id: 'T001', title: 'Subscribe YouTube channel', icon: '▶️', pts: 150, type: 'social', value: 7.5, count: 18, approved: 16, pending: 2 },
        { id: 'T002', title: 'Join Telegram channel', icon: '✈️', pts: 80, type: 'social', value: 4.0, count: 12, approved: 12, pending: 0 },
        { id: 'T004', title: 'Install & rate Play Store app', icon: '📱', pts: 300, type: 'app', value: 15.0, count: 9, approved: 7, pending: 2 },
        { id: 'T003', title: 'Retweet & like Twitter post', icon: '🐦', pts: 60, type: 'social', value: 3.0, count: 5, approved: 5, pending: 0 },
        { id: 'T009', title: 'Complete consumer survey', icon: '📝', pts: 120, type: 'survey', value: 6.0, count: 3, approved: 3, pending: 0 }
      ];
    }

    return result.sort((a, b) => b.count - a.count);
  }, [transactions, tasks]);

  const totalCompletionsCount = taskCompletionsData.reduce((sum, item) => sum + item.count, 0);
  const maxCompletionCount = taskCompletionsData.length > 0 ? Math.max(...taskCompletionsData.map(d => d.count)) : 1;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    onAddTask({
      id: 'T' + Date.now(),
      title: newTitle.trim(),
      desc: newDesc.trim(),
      pts: Number(newPts),
      value: parseFloat((newPts / systemSettings.ptsToCashRate).toFixed(2)),
      type: newType,
      status: newStatus,
      proof: newProof,
      icon: newIcon.trim() || '📋'
    });

    // Reset fields
    setNewTitle('');
    setNewDesc('');
    setNewPts(100);
    setNewType('social');
    setNewStatus('open');
    setNewProof('screenshot');
    setNewIcon('📋');
  };

  return (
    <div className="fadeIn space-y-6 pb-28">
      {/* Admin banner info */}
      <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 text-base">
            🛡️
          </div>
          <div>
            <h3 className="font-display font-bold text-red-400 text-xs">Admin Control Panel</h3>
            <p className="text-[10px] text-[#9191a8] hidden sm:block">Restricted dashboard view. Actions auditable.</p>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#1a1a24] border border-white/5 py-1 px-2.5 rounded-lg">
            <span className="text-[9px] text-[#5a5a72] uppercase tracking-widest hidden sm:inline">Proofs:</span>
            <span className="font-bold text-xs text-[#ffa94d] font-mono">{pendingProofs.length}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#1a1a24] border border-white/5 py-1 px-2.5 rounded-lg">
            <span className="text-[9px] text-[#5a5a72] uppercase tracking-widest hidden sm:inline">Flags:</span>
            <span className="font-bold text-xs text-[#ff4f4f] font-mono">{flaggedUsers.length}</span>
          </div>
        </div>
      </div>

      {/* Task Completion Popularity Analytics Card */}
      {bottomTab === 'home' && (
        <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-sm text-[#f0f0f8] flex items-center gap-1.5">
              <span>🔥 Task Completion Popularity Analytics</span>
            </h3>
            <p className="text-xs text-[#9191a8]">Distribution of completed customer actions across active campaigns tracked in the transaction ledger.</p>
          </div>
          <div className="bg-[#16161f] border border-white/5 py-1.5 px-3 rounded-xl shrink-0">
            <span className="text-[10px] text-[#5a5a72] block font-mono font-bold uppercase">Total Aggregated Completes</span>
            <span className="block font-black text-sm text-[#5aedcc] font-display">{totalCompletionsCount} submissions</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column: SVG Chart - Takes 3 columns out of 5 */}
          <div className="lg:col-span-3 bg-[#16161f] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-[#9191a8] uppercase font-bold tracking-wider block mb-3 font-mono">Completions Frequency Chart</span>
            </div>
            
            <div className="relative h-[210px] flex items-center justify-center">
              <svg viewBox="0 0 500 210" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c6cff" />
                    <stop offset="100%" stopColor="#5aedcc" />
                  </linearGradient>
                  <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a594ff" />
                    <stop offset="100%" stopColor="#3ff0c3" />
                  </linearGradient>
                </defs>

                {/* Y-Axis scale grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const yPos = 170 - (ratio * 150);
                  const displayVal = Math.round(ratio * maxCompletionCount);
                  return (
                    <g key={index}>
                      <line 
                        x1="40" 
                        y1={yPos} 
                        x2="480" 
                        y2={yPos} 
                        stroke="rgba(255, 255, 255, 0.04)" 
                        strokeDasharray="3 3"
                      />
                      <text 
                        x="32" 
                        y={yPos + 3} 
                        fill="#5a5a72" 
                        fontSize="8" 
                        fontFamily="monospace" 
                        textAnchor="end"
                      >
                        {displayVal}
                      </text>
                    </g>
                  );
                })}

                {/* Bars rendering */}
                {taskCompletionsData.slice(0, 6).map((item, i, array) => {
                  const barPadding = 14;
                  const numBars = array.length;
                  const chartWidth = 440;
                  const barWidth = (chartWidth - (numBars - 1) * barPadding) / numBars;
                  const x = 40 + i * (barWidth + barPadding);
                  const height = (item.count / maxCompletionCount) * 150;
                  const y = 170 - height;
                  
                  const isHovered = hoveredBarId === item.id;

                  return (
                    <g 
                      key={item.id}
                      onMouseEnter={() => setHoveredBarId(item.id)}
                      onMouseLeave={() => setHoveredBarId(null)}
                      className="cursor-pointer"
                    >
                      {/* Column Bar background track on hover */}
                      <rect 
                        x={x - barPadding/3}
                        y="20"
                        width={barWidth + (barPadding*2)/3}
                        height="150"
                        fill="transparent"
                        rx="4"
                        className="hover:fill-white/[0.015] transition-colors duration-200"
                      />

                      {/* Column Bar */}
                      <rect 
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(4, height)}
                        fill={isHovered ? "url(#barGradHover)" : "url(#barGrad)"}
                        rx="4"
                        className="transition-all duration-300"
                      />

                      {/* Text count values above bar */}
                      <text 
                        x={x + barWidth / 2}
                        y={y - 6}
                        fill={isHovered ? "#5aedcc" : "#a594ff"}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {item.count}
                      </text>

                      {/* X-Axis labels/icons */}
                      <text 
                        x={x + barWidth / 2}
                        y="186"
                        fill="#f0f0f8"
                        fontSize="11"
                        textAnchor="middle"
                      >
                        {item.icon}
                      </text>
                      <text 
                        x={x + barWidth / 2}
                        y="198"
                        fill={isHovered ? "#a594ff" : "#5a5a72"}
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {item.id}
                      </text>
                    </g>
                  );
                })}

                {/* Chart baseline Axis */}
                <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
              </svg>

              {/* HTML Hover tooltip overlay inside SVG container */}
              {hoveredBarId && (() => {
                const hoveredItem = taskCompletionsData.find(d => d.id === hoveredBarId);
                if (!hoveredItem) return null;
                return (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#1a1a24] border border-[#a594ff]/30 rounded-xl px-3.5 py-2 shadow-xl text-center pointer-events-none fadeIn space-y-0.5 z-10 w-48 animate-fade-in">
                    <span className="text-[9px] text-[#9191a8] uppercase font-bold tracking-wider font-mono block">
                      Campaign: {hoveredItem.id}
                    </span>
                    <p className="text-xs text-white font-bold font-display truncate">
                      {hoveredItem.icon} {hoveredItem.title}
                    </p>
                    <p className="text-[10px] text-[#5aedcc] font-mono">
                      <b>{hoveredItem.count}</b> completes total
                    </p>
                    <p className="text-[9px] text-[#5a5a72] font-mono">
                      ({hoveredItem.approved} approved · {hoveredItem.pending} pending)
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column: Mini leaderboard rankings table - Takes 2 columns */}
          <div className="lg:col-span-2 bg-[#16161f] border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] text-[#9191a8] uppercase font-bold tracking-wider block mb-3 font-mono">Completions Statistics Ledger</span>
              <div className="space-y-2 max-h-[175px] overflow-y-auto scrollbar-none">
                {taskCompletionsData.map((item, idx) => {
                  const sharePercent = totalCompletionsCount > 0 ? (item.count / totalCompletionsCount) * 100 : 0;
                  return (
                    <div 
                      key={item.id} 
                      className={`p-2 rounded-xl border transition-all ${
                        hoveredBarId === item.id 
                          ? 'bg-white/[0.04] border-[#a594ff]/25' 
                          : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                      }`}
                      onMouseEnter={() => setHoveredBarId(item.id)}
                      onMouseLeave={() => setHoveredBarId(null)}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white truncate max-w-[130px]">
                          {idx + 1}. {item.icon} {item.title}
                        </span>
                        <span className="font-mono text-[9px] font-bold text-[#5aedcc] bg-[#5aedcc]/10 px-1.5 py-0.5 rounded">
                          {item.count} runs
                        </span>
                      </div>
                      
                      <div className="mt-1 flex justify-between items-center text-[9px] text-[#5a5a72] font-mono">
                        <span>Points: {item.pts} pts</span>
                        <span>Share: {sharePercent.toFixed(1)}%</span>
                      </div>
                      
                      <div className="w-full bg-white/[0.02] h-1 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#7c6cff] to-[#5aedcc] transition-all duration-300" 
                          style={{ width: `${Math.max(3, sharePercent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-[#5a5a72] font-mono">
              <span>Source Ledger Sync:</span>
              <span className="text-white font-bold uppercase tracking-tight">Active</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Tabs */}
      {bottomTab === 'manage' && (
        <div className="flex flex-wrap gap-1.5 bg-[#16161f] border border-[#f0f0f8]/10 p-1.5 rounded-2xl w-full shadow-inner sticky top-0 z-10">
          <button
            id="admin-tab-users"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-[#7c6cff]/10 text-[#a594ff] shadow-md border border-[#7c6cff]/20' : 'text-[#9191a8] hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            👥 User Directory
          </button>
          <button
            id="admin-tab-proofs"
            onClick={() => setActiveTab('proofs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'proofs' ? 'bg-[#7c6cff]/10 text-[#a594ff] shadow-md border border-[#7c6cff]/20' : 'text-[#9191a8] hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            📸 Proof Submissions ({pendingProofs.length})
          </button>
          <button
            id="admin-tab-offers"
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'offers' ? 'bg-[#7c6cff]/10 text-[#a594ff] shadow-md border border-[#7c6cff]/20' : 'text-[#9191a8] hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            💼 CPA Task Campaigns
          </button>
          <button
            id="admin-tab-fraud"
            onClick={() => setActiveTab('fraud')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'fraud' ? 'bg-[#7c6cff]/10 text-[#a594ff] shadow-md border border-[#7c6cff]/20' : 'text-[#9191a8] hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            🚨 Fraud Base / Nodes
          </button>
          <button
            id="admin-tab-payouts"
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'payouts' ? 'bg-[#7c6cff]/10 text-[#a594ff] shadow-md border border-[#7c6cff]/20' : 'text-[#9191a8] hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            💸 Withdraw Payouts ({payouts.filter(x => x.status === 'pending').length})
          </button>
          <button
            id="admin-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'settings' ? 'bg-[#7c6cff]/10 text-[#a594ff] shadow-md border border-[#7c6cff]/20' : 'text-[#9191a8] hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            ⚙️ Global Settings
          </button>
          <button
            id="admin-tab-promos"
            onClick={() => setActiveTab('admin-promos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'admin-promos' ? 'bg-[#7c6cff]/10 text-[#a594ff] shadow-md border border-[#7c6cff]/20' : 'text-[#9191a8] hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            🎨 Promotional Banners
          </button>
          <button
            id="admin-tab-cpa"
            onClick={() => setActiveTab('cpa')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cpa' ? 'bg-[#7c6cff]/10 text-[#a594ff] shadow-md border border-[#7c6cff]/20' : 'text-[#9191a8] hover:bg-white/[0.02] hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> CPA Network
          </button>
        </div>
      )}

      {/* Tab Panels */}
      {bottomTab === 'home' && (
        <div id="admin-analytics-panel" className="space-y-6">
          {/* KPI Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-1.5 focus-ring">
              <span className="text-[10px] text-[#9191a8] uppercase tracking-wider font-semibold block">Global Pool Economy</span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl lg:text-xl xl:text-2xl font-black text-[#5aedcc] font-display break-all">{(totalToolExecutions * 5 + 45000).toLocaleString()} <span className="text-sm">PTS</span></span>
                <span className="text-[10px] text-[#3ff0c3] bg-[#3ff0c3]/10 px-1.5 py-0.5 rounded-md font-semibold font-mono">+12%</span>
              </div>
              <p className="text-[10px] text-[#5a5a72]">Total unwithdrawn network float points</p>
            </div>

            <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-1.5">
              <span className="text-[10px] text-[#9191a8] uppercase tracking-wider font-semibold block">Pending Queue Count</span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl lg:text-xl xl:text-2xl font-black text-[#ffa94d] font-display break-all">{pendingProofs.length}</span>
                <span className="text-xs text-[#a594ff] font-bold font-mono text-opacity-80">VERIFS</span>
              </div>
              <p className="text-[10px] text-[#5a5a72]">Unprocessed task submissions awaiting admin audit</p>
            </div>

            <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-1.5">
              <span className="text-[10px] text-[#9191a8] uppercase tracking-wider font-semibold block">API Webhook Hits</span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl lg:text-xl xl:text-2xl font-black text-[#7c6cff] font-display break-all">{(totalToolExecutions * 14 + 1823).toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-[#5a5a72]">Total inbound third-party request callbacks today</p>
            </div>

            <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-1.5">
              <span className="text-[10px] text-[#9191a8] uppercase tracking-wider font-semibold block">Paid Reward Pool</span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black text-[#3ecf8e] font-display">₹{(totalToolExecutions * 0.25).toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-[#5a5a72]">Estimated monetary value distributed under campaigns</p>
            </div>
          </div>

          {/* PDF tools usage ranked tracker REMOVED */}
        </div>
      )}

      {/* Tab Panels */}
      {bottomTab === 'manage' && activeTab === 'proofs' && (
        <div id="admin-proofs-panel" className="space-y-4">
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-sm text-[#f0f0f8] flex items-center gap-2">
              <span className="text-[#a594ff]">📸</span> Pending Verification Queue
            </h3>
            
            {pendingProofs.length === 0 ? (
              <div className="text-center py-12 border border-white/5 rounded-xl bg-[#16161f] text-[#5a5a72]">
                No pending proofs left to verify ✓
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#16161f] text-[#9191a8] border-b border-white/5">
                      <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Worker & Task</th>
                      <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Proof Link</th>
                      <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[#f0f0f8]">
                    {pendingProofs.map(s => {
                      const matchingTask = tasks.find(t => t.id === s.taskId);
                      return (
                        <tr key={s.id} className="hover:bg-white/[0.02]">
                          <td className="p-3.5 whitespace-nowrap align-top">
                            <h4 className="text-[11px] font-semibold text-white">{matchingTask?.title || 'System Task'}</h4>
                            <div className="text-[10px] text-[#9191a8] mt-1 space-y-0.5">
                              <p>Worker: <span className="text-[#a594ff]">{s.userName}</span></p>
                              <p className="font-mono">{s.submittedAt}</p>
                              <p className="text-[#3ecf8e] font-bold">Reward: {matchingTask?.pts || 0} pts</p>
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap align-top">
                            <div className="bg-[#0a0a0f] border border-white/5 rounded-lg p-2 max-w-sm">
                              <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/5">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-[#a594ff] font-mono">Proof Link</span>
                                <span className="text-[9px] bg-orange-500/10 text-[#ffa94d] px-1.5 py-0.5 rounded font-bold font-mono">PENDING</span>
                              </div>
                              <div className="text-[9px] text-[#787891] font-mono break-all mb-2">
                                {s.proof}
                              </div>
                              {(s.proof.includes('http') || s.proof.includes('cloudinary.com')) && (
                                <a 
                                  href={s.proof.includes('http') ? s.proof : `https://${s.proof.replace('Proof identifier: ', '').trim()}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#5aedcc] bg-[#5aedcc]/10 hover:bg-[#5aedcc]/20 border border-[#5aedcc]/20 px-2.5 py-1 rounded transition-all select-none"
                                >
                                  <span>👁️</span> View Image Proof
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 align-top text-right">
                            <div className="flex flex-col gap-2 items-end">
                              <button
                                id={`approve-proof-btn-${s.id}`}
                                onClick={() => onApproveProof(s.id)}
                                className="bg-[#3ecf8e]/12 hover:bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/25 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all font-display w-24 text-center"
                              >
                                Approve
                              </button>
                              <button
                                id={`reject-proof-btn-${s.id}`}
                                onClick={() => onRejectProof(s.id)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-[#ff4f4f] border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all font-display w-24 text-center"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {bottomTab === 'manage' && activeTab === 'offers' && (
        <div id="admin-offers-panel" className="space-y-6">
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-sm text-[#f0f0f8] flex items-center gap-2">
              <span>➕ Launch New Offer/Task Campaign</span>
            </h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Campaign Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Watch YouTube Video & Subscribe"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none placeholder-[#5a5a72] focus:border-[#7c6cff]"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Emoji Icon representation</label>
                  <input 
                    type="text"
                    placeholder="e.g. ▶️, 📱, 🎮, 🐦"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none placeholder-[#5a5a72] focus:border-[#7c6cff]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Campaign Instructions (Description)</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Provide precise rules on how the user completes the campaign and gets verified..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none placeholder-[#5a5a72] focus:border-[#7c6cff] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Category Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  >
                    <option value="social font-semibold">Social Media Network</option>
                    <option value="app">Mobile App Install</option>
                    <option value="survey">Paid Survey Feedback</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Reward Points</label>
                  <input 
                    type="number"
                    min={10}
                    max={5000}
                    value={newPts}
                    onChange={(e) => setNewPts(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                  <p className="text-[9px] text-[#3ecf8e] mt-1">Calculated payout: ₹{(newPts / systemSettings.ptsToCashRate).toFixed(2)} cash value</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Required Verification</label>
                  <select
                    value={newProof}
                    onChange={(e) => setNewProof(e.target.value as any)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  >
                    <option value="screenshot">Screenshot Upload (Requires Admin Validation)</option>
                    <option value="auto">Auto-Verify (Instant Rewards Execution)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Tag Priority</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  >
                    <option value="open">Standard Open</option>
                    <option value="hot">🔥 Hot Campaign</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#7c6cff] hover:bg-[#6a5aef] text-white px-6 py-2.5 rounded-xl font-display font-bold text-xs select-none cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  ➕ Add Campaign Offer
                </button>
              </div>
            </form>
          </div>

          {/* Active Campaigns list view */}
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-sm text-[#f0f0f8]">Active System Campaigns</h3>
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#16161f] text-[#9191a8] border-b border-white/5">
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Campaign</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Type</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Reward</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Verification</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Status</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.01]">
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg shrink-0">{t.icon}</span>
                          <div>
                            <span className="font-semibold text-white block">{t.title}</span>
                            <span className="text-[10px] text-[#5a5a72] block truncate max-w-xs">{t.desc}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap capitalize">
                        <span className="bg-[#16161f] px-2.5 py-0.5 rounded-full text-[9px] text-[#a594ff] font-semibold tracking-wide border border-white/5">
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-display">
                          <span className="text-[#3ecf8e] font-bold block">₹{t.value.toFixed(2)}</span>
                          <span className="text-[9px] text-[#5a5a72] block">{t.pts} Points</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap capitalize text-[11px] text-[#9191a8]">
                        {t.proof === 'screenshot' ? 'Screenshot Validation' : 'Instant Auto-Verify'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight ${
                          t.status === 'hot' ? 'bg-orange-500/12 text-orange-400 border border-orange-500/20' : 'bg-green-500/12 text-[#3ecf8e] border border-[#3ecf8e]/10'
                        }`}>
                          {t.status === 'hot' ? '🔥 Hot Offer' : 'Standard Open'}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteTask(t.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-[#ff4f4f] border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all font-display"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {bottomTab === 'manage' && activeTab === 'fraud' && (
        <div id="admin-fraud-panel" className="space-y-6">
          
          {/* Device Fingerprint Collision Log Dashboard */}
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-sm text-[#f0f0f8] flex items-center gap-2">
              <span className="text-orange-500">🧬</span> Device Fingerprint Collision Log
            </h3>
            <p className="text-xs text-[#9191a8]">Tracks and correlates node hardware similarities across separate network accounts to detect multi-account abuse rings.</p>
            
            <div className="overflow-x-auto rounded-xl border border-white/5 mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#16161f] text-[#9191a8] border-b border-white/5">
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Fingerprint</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Accounts</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Match Strength</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#f0f0f8]">
                  {realCollisions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[#59597a]">
                        ✅ No real device collisions or fingerprint irregularities detected in the node registry.
                      </td>
                    </tr>
                  ) : (
                    realCollisions.map((collision, i) => (
                      <tr 
                        key={i} 
                        className={collision.allSuspended ? "bg-white/[0.01]" : "bg-red-500/10 border-l border-red-500 transition-all font-display animate-pulse"}
                      >
                        <td className="p-3.5 whitespace-nowrap text-xs font-mono font-bold text-red-400">
                          🔌 IP: {collision.ip}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-extrabold text-white text-xs block mb-1">
                            {collision.users.length} Accounts Connected
                          </span>
                          <div className="space-y-1">
                            {collision.users.map(u => (
                              <div key={u.id} className="flex items-center gap-1.5 text-[10px] font-mono">
                                <span className={u.suspended ? "line-through text-[#6e6e8a]" : "text-white font-semibold"}>
                                  @{u.fname} {u.lname} ({u.id})
                                </span>
                                {u.suspended ? (
                                  <span className="text-[8px] bg-red-500/10 text-red-400 px-1 py-0.2 rounded font-sans scale-90">BLOCKED</span>
                                ) : (
                                  <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1 py-0.2 rounded font-sans scale-90">ACTIVE</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="text-red-400 font-black block">{collision.matchStrength}</span>
                          <span className="text-[9px] text-[#5a5a72] block font-mono">ID: ring-{collision.ip.replace(/\./g, '')}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-right">
                          {collision.allSuspended ? (
                            <span className="text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded text-[10px] font-bold">
                              ✓ Ring Blocked (Frozen)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleBanCluster(collision.users)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase cursor-pointer shadow-md select-none"
                            >
                              BAN RING
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                  {/* Built-in static sandbox examples underneath to guarantee mock illustration support */}
                  <tr className="bg-red-500/5 opacity-60">
                    <td className="p-3.5 whitespace-nowrap font-mono text-[10px] text-[#ffa94d]">ab12x9.ff0.node</td>
                    <td className="p-3.5 whitespace-nowrap font-semibold">
                      3 Accounts <span className="text-[#9191a8] font-normal text-[10px] block font-mono">USR0005, USR0021, USR00B4</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap"><span className="text-red-400 font-bold">100% (Identical IPs/Canvas)</span></td>
                    <td className="p-3.5 whitespace-nowrap text-right">
                      <span className="text-[#ffa94d] bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded text-[9px] font-mono">SANDBOX DEMO</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-[#f0f0f8] px-1">Active Fraud Triggers</h3>
            {flaggedUsers.length === 0 ? (
              <div className="text-center py-12 bg-[#1a1a24] border border-white/7 rounded-2xl text-[#5a5a72]">
                No active fraud trigger rules currently tripped.
              </div>
            ) : (
              flaggedUsers.map(u => (
                <div key={u.id} className="bg-red-500/8 border border-red-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-sm font-semibold text-[#ff4f4f]">{u.fname} {u.lname} — {u.email}</h4>
                    <p className="text-xs text-[#9191a8] font-mono mt-1 block">
                      Velocity anomaly: Completed {u.tasksCompleted} tasks · Wallet: ₹{u.balance} · Network Clone Detected.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      id={`suspend-user-btn-${u.id}`}
                      onClick={() => onSuspendUser(u.id)}
                      className="bg-[#ff4f4f] hover:bg-[#ff3b3b] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all font-display"
                    >
                      🚫 Ban Node (Freeze)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {bottomTab === 'manage' && activeTab === 'payouts' && (
        <div id="admin-payouts-panel">
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-bold text-sm text-[#f0f0f8] flex items-center gap-2">
              <span className="text-[#3ecf8e]">💸</span> Pending Payout Request Queue
            </h3>
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#16161f] text-[#9191a8] border-b border-white/5">
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Date & User</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Destination</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px] text-right">Amount</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[#5a5a72]">No withdrawals queue list yet.</td>
                    </tr>
                  ) : (
                    payouts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="p-3.5 whitespace-nowrap align-top">
                          <h4 className="font-semibold text-white">{p.userName}</h4>
                          <span className="text-[10px] text-[#9191a8] font-mono">{p.date}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span className="bg-[#7c6cff]/12 text-[#a594ff] px-2 py-0.5 rounded text-[9px] font-semibold border border-[#7c6cff]/20 uppercase tracking-widest">
                              {p.method}
                            </span>
                            <div className="flex items-center gap-2 bg-[#0a0a0f] border border-white/5 px-2 py-1.5 rounded-lg mt-1 w-full max-w-[200px]">
                              <span className="font-mono text-[10px] text-white break-all flex-1 select-all">{p.dest}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(p.dest);
                                  alert('Destination address copied to clipboard!');
                                }}
                                className="shrink-0 group relative p-1 hover:bg-white/10 rounded cursor-pointer"
                                title="Copy Clear Text Destination"
                              >
                                <span className="text-[#a594ff]">📋</span>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-right align-top">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-[#3ecf8e] font-display text-sm">₹{p.amount.toFixed(2)} <span className="text-[9px] text-[#5a5a72]">INR</span></span>
                            <span className="text-[10px] text-[#ffa94d] font-mono bg-orange-500/10 px-1.5 py-0.5 rounded">
                              {Math.round(p.amount * systemSettings.ptsToCashRate)} PTS Converted
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-center align-top">
                          {p.status === 'pending' ? (
                            <div className="flex flex-col gap-1.5 items-end justify-center w-full">
                              <button
                                id={`pay-withdraw-btn-${p.id}`}
                                onClick={() => onApprovePayout(p.id)}
                                className="bg-[#3ecf8e]/10 hover:bg-[#3ecf8e]/20 border border-[#3ecf8e]/30 text-[#3ecf8e] px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all font-display w-full max-w-[130px] whitespace-nowrap text-center"
                              >
                                Mark as Paid
                              </button>
                              <button
                                id={`reject-withdraw-btn-${p.id}`}
                                onClick={() => onRejectPayout(p.id)}
                                className="bg-[#16161f] border border-red-500/30 hover:bg-red-500/10 text-[#ff4f4f] px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all font-display w-full max-w-[130px] whitespace-nowrap text-center"
                              >
                                Reject & Refund
                              </button>
                            </div>
                          ) : p.status === 'approved' ? (
                            <span className="text-[#3ecf8e] bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap">
                              ✓ Paid (Ledger locked)
                            </span>
                          ) : (
                            <span className="text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap">
                              × Rejected (Refunded)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {bottomTab === 'manage' && activeTab === 'users' && (
        <div id="admin-users-panel">
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-bold text-sm text-[#f0f0f8]">System Directory</h3>
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#16161f] text-[#9191a8] border-b border-white/5">
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Name</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px]">Email</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px] text-right">Points</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px] text-right">Balance</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px] text-center">Refs</th>
                    <th className="p-3.5 whitespace-nowrap font-display font-semibold uppercase tracking-wider text-[10px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {standardUsers.map((u, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01]">
                      <td className="p-3.5 whitespace-nowrap font-medium text-white">{u.fname} {u.lname}</td>
                      <td className="p-3.5 whitespace-nowrap text-[#9191a8]">{u.email}</td>
                      <td className="p-3.5 whitespace-nowrap text-right font-semibold font-display text-white">{u.points.toLocaleString()}</td>
                      <td className="p-3.5 whitespace-nowrap text-right font-bold font-display text-[#3ecf8e]">₹{u.balance.toFixed(2)}</td>
                      <td className="p-3.5 whitespace-nowrap text-center text-white">{u.refs}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`badge px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          u.suspended ? 'bg-red-500/12 text-[#ff4f4f] border-red-500/20' :
                          u.fraudFlag ? 'bg-orange-500/12 text-[#ffa94d] border-orange-500/20' :
                          'bg-[#3ecf8e]/12 text-[#3ecf8e] border-[#3ecf8e]/20'
                        }`}>
                          {u.suspended ? 'Suspended' : u.fraudFlag ? 'Flagged Alert' : 'Good Standing'}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            id={`edit-user-btn-${u.id}`}
                            onClick={() => {
                              setEditingUser(u);
                              setEditPoints(u.points);
                              setEditBalance(u.balance);
                              setEditRefs(u.refs);
                              setEditTasksCompleted(u.tasksCompleted || 0);
                              setEditRole(u.role);
                              setEditFname(u.fname);
                              setEditLname(u.lname);
                              setEditRefBy(u.refBy || '');
                            }}
                            className="bg-[#7c6cff]/10 hover:bg-[#7c6cff]/20 text-[#a594ff] px-2.5 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-all font-display"
                          >
                            ✏️ Edit Stats
                          </button>

                          {/* Fast point adjustment */}
                          <div className="flex flex-col gap-0.5" title="Manual Wallet Balance Override Controller">
                            <button 
                              onClick={() => {
                                const incr = window.prompt("Enter amount to add (+)", "500");
                                if (incr && !isNaN(Number(incr))) {
                                  onUpdateUserFields(u.id, { points: u.points + Number(incr) });
                                }
                              }}
                              className="bg-[#3ecf8e]/10 hover:bg-[#3ecf8e]/20 text-[#3ecf8e] px-1.5 py-0.5 rounded text-[8px] font-mono font-bold cursor-pointer"
                            >
                              + ADD
                            </button>
                            <button 
                              onClick={() => {
                                const decr = window.prompt("Enter amount to subtract (-)", "500");
                                if (decr && !isNaN(Number(decr))) {
                                  const newPts = Math.max(0, u.points - Number(decr));
                                  onUpdateUserFields(u.id, { points: newPts });
                                }
                              }}
                              className="bg-orange-500/10 hover:bg-orange-500/20 text-[#ffa94d] px-1.5 py-0.5 rounded text-[8px] font-mono font-bold cursor-pointer"
                            >
                              - SUB
                            </button>
                          </div>

                          <button
                            id={`toggle-suspend-btn-${u.id}`}
                            onClick={() => onToggleSuspendUser(u.id)}
                            className={`px-2 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-all font-display ${
                              u.suspended ? 'bg-[#3ecf8e] hover:bg-[#30a872] text-white' : 'bg-[#16161f] border border-red-500/30 hover:bg-red-500/10 text-[#ff4f4f]'
                            }`}
                            title="Freeze Wallet & Ban Node"
                          >
                            {u.suspended ? 'Reinstate Node' : 'Freeze / Ban'}
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Are you absolutely sure you want to permanently delete user ${u.fname} ${u.lname}? All account data and transaction history will be purged.`)) {
                                onDeleteUser?.(u.id);
                              }
                            }}
                            className="bg-red-500/15 hover:bg-red-500/35 text-red-500 p-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center shrink-0"
                            title="Delete user completely"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {bottomTab === 'manage' && activeTab === 'settings' && (
        <div id="admin-settings-panel" className="space-y-6 animate-fade-in">
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="font-display font-bold text-base text-[#f0f0f8] flex items-center gap-2">
                <span>⚙️ System Core Config & Feature Manager</span>
              </h3>
              <p className="text-xs text-[#9191a8]">Turn features off/on globally in the User Panel and adjust conversion rates in real-time.</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateSettings({
                ptsToCashRate: Number(formPtsToCash),
                minWithdrawal: Number(formMinWithdraw),
                signupBonus: Number(formSignupBonus),
                vipMultiplier: Number(formVipMultiplier),
                disableOfferwall: formDisableOffer,
                disableTasks: formDisableTasks,
                disableReferrals: formDisableRefs,
              });
            }} className="space-y-6">
              
              {/* Feature modules active flags section */}
              <div className="border border-white/5 rounded-2xl p-5 bg-[#16161f] space-y-4">
                <span className="text-[10px] text-[#9191a8] uppercase font-bold tracking-wider block font-mono">Module Active / Block State Toggles</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Premium Tasks toggle */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-white block">Disable Premium Tasks</span>
                      <span className="text-[10px] text-[#5a5a72]">Omit CPA survey and adwalls page access</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="accent-[#7c6cff] h-4 w-4 cursor-pointer"
                      checked={formDisableOffer}
                      onChange={(e) => setFormDisableOffer(e.target.checked)}
                    />
                  </label>

                  {/* Micro tasks toggle */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-white block">Disable Tasks Section</span>
                      <span className="text-[10px] text-[#5a5a72]">Disable micro-proof submission panel totally</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="accent-[#7c6cff] h-4 w-4 cursor-pointer"
                      checked={formDisableTasks}
                      onChange={(e) => setFormDisableTasks(e.target.checked)}
                    />
                  </label>

                  {/* Referrals program toggle */}
                  <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5 mb-0.5">Disable Network Referrals <span className="text-[8px] bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/30 px-1.5 py-0.5 rounded font-black tracking-widest leading-none">10% COMMISSION LOOP ACTIVE</span></span>
                      <span className="text-[10px] text-[#5a5a72]">Disable multi-tier refer mapping sharing layout page</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="accent-[#7c6cff] h-4 w-4 cursor-pointer"
                      checked={formDisableRefs}
                      onChange={(e) => setFormDisableRefs(e.target.checked)}
                    />
                  </label>

                </div>
              </div>

              {/* Numerical settings values */}
              <div className="border border-white/5 rounded-2xl p-5 bg-[#16161f] space-y-4">
                <span className="text-[10px] text-[#9191a8] uppercase font-bold tracking-wider block font-mono">Platform Rates & Limits Config</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* points to cash */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#9191a8] uppercase font-bold font-mono">Point Exchange Rate (Pts per ₹1)</label>
                    <input 
                      type="number" 
                      min={1}
                      className="w-full bg-[#1a1a24] border border-[#f0f0f8]/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#7c6cff]"
                      value={formPtsToCash}
                      onChange={(e) => setFormPtsToCash(Number(e.target.value))}
                    />
                    <p className="text-[9px] text-[#5a5a72]">Points required to earn ₹1 cash. (Ex. 20 pts = ₹1)</p>
                  </div>

                  {/* min withdraw amount */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#9191a8] uppercase font-bold font-mono">Min Withdrawal Limit (₹)</label>
                    <input 
                      type="number" 
                      min={10}
                      className="w-full bg-[#1a1a24] border border-[#f0f0f8]/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#7c6cff]"
                      value={formMinWithdraw}
                      onChange={(e) => setFormMinWithdraw(Number(e.target.value))}
                    />
                    <p className="text-[9px] text-[#5a5a72]">Minimum cash balance amount required to file request</p>
                  </div>

                  {/* signup points bonus */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#9191a8] uppercase font-bold font-mono">Sign-up Point Bonus (pts)</label>
                    <input 
                      type="number" 
                      min={0}
                      className="w-full bg-[#1a1a24] border border-[#f0f0f8]/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#7c6cff]"
                      value={formSignupBonus}
                      onChange={(e) => setFormSignupBonus(Number(e.target.value))}
                    />
                    <p className="text-[9px] text-[#5a5a72]">Free starter points received on first register</p>
                  </div>

                  {/* Vip proof multiplier */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#9191a8] uppercase font-bold font-mono">Tasks Reward Multiplier (x)</label>
                    <input 
                      type="number" 
                      step={0.1}
                      min={1}
                      className="w-full bg-[#1a1a24] border border-[#f0f0f8]/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#7c6cff]"
                      value={formVipMultiplier}
                      onChange={(e) => setFormVipMultiplier(Number(e.target.value))}
                    />
                    <p className="text-[9px] text-[#5a5a72]">Multiplies point payouts for campaign submissions (Ex: 1.5x)</p>
                  </div>

                  {/* PDF run limits removed */}

                </div>
              </div>

              {/* Submit settings change */}
              <div className="flex justify-end">
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-[#7c6cff] to-[#5aedcc] hover:opacity-90 text-[#0f0f16] font-display font-black text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-all uppercase tracking-wider"
                >
                  💾 Save System Parameters
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {bottomTab === 'manage' && activeTab === 'admin-promos' && (
        <div id="admin-promos-tab-panel" className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-display font-black text-sm text-[#f0f0f8] flex items-center gap-2">
                  <span>🎨 Promotional Banner Ads Manager</span>
                </h3>
                <p className="text-xs text-[#9191a8] mt-1">
                  Create, configure, and publish rich, stylized gradient banners with custom action links to engage your users!
                </p>
              </div>
              <span className="text-[10px] bg-[#7c6cff]/20 text-[#a594ff] px-2.5 py-1 rounded-full font-mono font-bold">
                PROMO ENGINE ACTIVE
              </span>
            </div>

            {/* List and manage existing banners */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] text-[#9191a8] uppercase tracking-wider font-extrabold flex items-center justify-between">
                <span>Active Banner Campaigns ({systemSettings.promoBanners?.length || 0})</span>
                {editingBannerId && (
                  <button
                    onClick={() => {
                      setEditingBannerId(null);
                      setNewBannerTitle('');
                      setNewBannerSubtitle('');
                      setNewBannerBadge('');
                      setNewBannerActionUrl('');
                      setNewBannerActionText('');
                    }}
                    className="text-xs text-[#7c6cff] hover:underline normal-case font-semibold"
                  >
                    Clear Edit State
                  </button>
                )}
              </h4>

              {(!systemSettings.promoBanners || systemSettings.promoBanners.length === 0) ? (
                <div className="p-6 rounded-2xl border border-dashed border-white/5 text-center text-xs text-[#5a5a72] bg-white/[0.01]">
                  🎉 No custom banner ads currently exist. Use the builder form below to launch your first banner!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {systemSettings.promoBanners.map((banner) => (
                    <div
                      key={banner.id}
                      className={`p-4.5 rounded-2xl border relative overflow-hidden transition-all bg-gradient-to-r ${banner.bgGradient} ${banner.borderColor} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
                    >
                      {/* Left: Metadata */}
                      <div className="space-y-1.5 flex-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {banner.badge && (
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${banner.badgeBg}`}>
                              {banner.badge}
                            </span>
                          )}
                          <span className="text-[9px] text-[#9191a8] font-mono font-medium">ID: {banner.id}</span>
                          {!banner.active ? (
                            <span className="bg-red-500/15 text-red-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                              INACTIVE
                            </span>
                          ) : (
                            <span className="bg-emerald-500/15 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                              LIVE Feed
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-white font-display">{banner.title}</h5>
                        {banner.subtitle && (
                          <p className="text-xs text-[#9191a8] leading-normal">{banner.subtitle}</p>
                        )}
                        {banner.actionUrl && (
                          <div className="flex items-center gap-2 pt-1 text-[10px]">
                            <span className="text-[#5a5a72] font-semibold">Action Destination:</span>
                            <span className="text-[#a594ff] truncate font-mono bg-black/30 px-1 py-0.5 rounded max-w-sm">{banner.actionUrl}</span>
                            {banner.actionText && (
                              <span className="text-emerald-400 font-medium">({banner.actionText})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Controls */}
                      <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end border-t border-white/5 md:border-t-0 pt-3 md:pt-0">
                        {/* Toggle Active Switch */}
                        <button
                          onClick={() => {
                            const updated = (systemSettings.promoBanners || []).map(x =>
                              x.id === banner.id ? { ...x, active: !x.active } : x
                            );
                            onUpdateSettings({ ...systemSettings, promoBanners: updated });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold leading-none select-none cursor-pointer transition-all ${
                            banner.active
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-sm border border-emerald-500/20'
                              : 'bg-white/5 text-[#9191a8] hover:bg-white/10'
                          }`}
                        >
                          {banner.active ? '🟢 Enabled' : '🔴 Disabled'}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingBannerId(banner.id);
                            setNewBannerTitle(banner.title);
                            setNewBannerSubtitle(banner.subtitle || '');
                            setNewBannerBadge(banner.badge || '');
                            setNewBannerActionUrl(banner.actionUrl || '');
                            setNewBannerActionText(banner.actionText || '');
                            // Try restoring preset flavor
                            if (banner.bgGradient.includes('pink-500')) {
                              setNewBannerBgPreset('pink');
                            } else if (banner.bgGradient.includes('emerald-500')) {
                              setNewBannerBgPreset('emerald');
                            } else if (banner.bgGradient.includes('amber-500')) {
                              setNewBannerBgPreset('amber');
                            } else if (banner.bgGradient.includes('0088cc')) {
                              setNewBannerBgPreset('blue');
                            } else {
                              setNewBannerBgPreset('purple');
                            }
                            // Smooth scroll into focus of the builder form
                            document.getElementById('ad-generator-form-anchor')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                        >
                          ✏️ Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (confirm(`Are you absolutely sure you want to permanently delete campaign "${banner.title}"?`)) {
                              const updated = (systemSettings.promoBanners || []).filter(x => x.id !== banner.id);
                              onUpdateSettings({ ...systemSettings, promoBanners: updated });
                              if (editingBannerId === banner.id) {
                                setEditingBannerId(null);
                                setNewBannerTitle('');
                                setNewBannerSubtitle('');
                                setNewBannerBadge('');
                                setNewBannerActionUrl('');
                                setNewBannerActionText('');
                              }
                            }
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2 rounded-xl transition-all cursor-pointer"
                          title="Delete Banner Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Campaign Generator/Editor Form */}
            <div id="ad-generator-form-anchor" className="bg-[#16161f] p-5.5 rounded-2xl border border-white/5 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs text-[#a594ff] uppercase tracking-wider font-extrabold flex items-center gap-2">
                  <span>🚀 {editingBannerId ? '✏️ Edit Existing Campaign' : '✨ Design Brand New Banner Campaign'}</span>
                </h4>
                {editingBannerId && (
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                    Editing Mode
                  </span>
                )}
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider font-bold">Banner Header Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🎁 level-3 Commission Multiplier!"
                    value={newBannerTitle}
                    onChange={(e) => setNewBannerTitle(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] placeholder-[#5a5a72]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider font-bold">Featured Badging Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. EXTRA POINTS, HOT, NEW, CODES"
                    value={newBannerBadge}
                    onChange={(e) => setNewBannerBadge(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] placeholder-[#5a5a72]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider font-bold">Description Subtitle Narrative Statement</label>
                  <input
                    type="text"
                    placeholder="Provide short action summary: e.g. Instantly claim up to 500 PTS by executing five surveys on AdGate wall today!"
                    value={newBannerSubtitle}
                    onChange={(e) => setNewBannerSubtitle(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] placeholder-[#5a5a72]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider font-bold">Destination URL Link Redirect (epx: profile, tasks, referrals, or standard web HTTP/HTTPS URLs)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://t.me/OfficialEarnHub or 'referrals' or 'tasks'"
                    value={newBannerActionUrl}
                    onChange={(e) => setNewBannerActionUrl(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] placeholder-[#5a5a72] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider font-bold">Incentive Button Label Action Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Join Telegram, Refer Friends, Get Coupon"
                    value={newBannerActionText}
                    onChange={(e) => setNewBannerActionText(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] placeholder-[#5a5a72]"
                  />
                </div>

                {/* Preset gradients style config */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider font-bold">Styling Color Gradient Selection Vibe</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                    {[
                      { key: 'purple', label: 'Indigo Purple', bg: 'bg-[#7c6cff]', desc: 'Royal violet feeling' },
                      { key: 'pink', label: 'Magenta Pink', bg: 'bg-pink-500', desc: 'Prominent, eye-catching' },
                      { key: 'emerald', label: 'Forest Green', bg: 'bg-emerald-500', desc: 'Financial prosperity' },
                      { key: 'amber', label: 'Golden Yellow', bg: 'bg-amber-500', desc: 'Premium luxury alert' },
                      { key: 'blue', label: 'Cyan Blue', bg: 'bg-[#0088cc]', desc: 'Sleek interface standard' },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.key}
                        onClick={() => setNewBannerBgPreset(p.key)}
                        className={`p-3 rounded-2xl border text-xs text-left font-bold flex flex-col gap-2 transition-all cursor-pointer ${
                          newBannerBgPreset === p.key
                            ? 'border-[#7c6cff] bg-[#7c6cff]/10 text-white shadow-xl'
                            : 'border-white/5 bg-white/[0.02] text-[#9191a8] hover:bg-white/5'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${p.bg} shadow-md shrink-0`} />
                        <div>
                          <p className="font-semibold block leading-tight">{p.label}</p>
                          <p className="text-[8px] text-[#5a5a72] font-normal leading-normal mt-0.5">{p.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Mockup Preview */}
              <div className="border border-white/5 p-4 rounded-xl bg-black/40 space-y-2">
                <span className="text-[9px] text-[#5a5a72] uppercase font-bold tracking-widest font-mono block">Real-time Banner Feed Preview</span>
                
                {(() => {
                  let previewBg = 'from-[#7c6cff]/10 via-transparent to-transparent';
                  let previewBorder = 'border-[#7c6cff]/25';
                  let previewBadge = 'bg-[#7c6cff]/15 text-[#a594ff]';

                  if (newBannerBgPreset === 'pink') {
                    previewBg = 'from-pink-500/10 via-transparent to-transparent';
                    previewBorder = 'border-pink-500/25';
                    previewBadge = 'bg-pink-500/15 text-pink-400';
                  } else if (newBannerBgPreset === 'emerald') {
                    previewBg = 'from-emerald-500/10 via-transparent to-transparent';
                    previewBorder = 'border-emerald-500/25';
                    previewBadge = 'bg-emerald-500/15 text-emerald-400';
                  } else if (newBannerBgPreset === 'amber') {
                    previewBg = 'from-amber-500/10 via-transparent to-transparent';
                    previewBorder = 'border-amber-500/25';
                    previewBadge = 'bg-amber-500/15 text-amber-400';
                  } else if (newBannerBgPreset === 'blue') {
                    previewBg = 'from-[#0088cc]/10 via-transparent to-transparent';
                    previewBorder = 'border-[#0088cc]/25';
                    previewBadge = 'bg-[#0088cc]/15 text-[#33b1ff]';
                  }

                  const previewTitleText = newBannerTitle.trim() || '🎁 Enter Promotional Header Title Above';
                  const previewSubtitleText = newBannerSubtitle.trim() || 'Describe your promotion campaign highlights here...';
                  const previewBadgeText = newBannerBadge.trim().toUpperCase() || 'INFO';
                  const previewBtnText = newBannerActionText.trim() || 'Explore Campaign';

                  return (
                    <div className={`bg-gradient-to-r ${previewBg} border ${previewBorder} p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[125px]`}>
                      <div className="space-y-1 relative z-10 w-full pr-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${previewBadge}`}>
                            {previewBadgeText}
                          </span>
                          <span className="text-[9px] text-[#9191a8] uppercase font-bold tracking-wider">Promotional Deal</span>
                        </div>
                        <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider">{previewTitleText}</h4>
                        <p className="text-[10px] text-[#d0d0e0] leading-relaxed line-clamp-2">{previewSubtitleText}</p>
                      </div>
                      
                      <div className="pt-2 relative z-10 self-start">
                        <button type="button" className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-lg border leading-tight transition-all block text-center ${previewBadge}`}>
                          {previewBtnText} →
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Actions Button */}
              <div className="flex gap-3">
                {editingBannerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBannerId(null);
                      setNewBannerTitle('');
                      setNewBannerSubtitle('');
                      setNewBannerBadge('');
                      setNewBannerActionUrl('');
                      setNewBannerActionText('');
                    }}
                    className="w-1/3 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-display font-bold text-xs border border-white/10 transition-all cursor-pointer text-center"
                  >
                    Cancel Editing
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!newBannerTitle.trim()) {
                      alert('Please specify a promotional header title.');
                      return;
                    }

                    let bgGradient = 'from-[#7c6cff]/10 via-transparent to-transparent';
                    let borderColor = 'border-[#7c6cff]/25';
                    let badgeBg = 'bg-[#7c6cff]/15 text-[#a594ff]';

                    if (newBannerBgPreset === 'pink') {
                      bgGradient = 'from-pink-500/10 via-transparent to-transparent';
                      borderColor = 'border-pink-500/25';
                      badgeBg = 'bg-pink-500/15 text-pink-400';
                    } else if (newBannerBgPreset === 'emerald') {
                      bgGradient = 'from-emerald-500/10 via-transparent to-transparent';
                      borderColor = 'border-emerald-500/25';
                      badgeBg = 'bg-emerald-500/15 text-emerald-400';
                    } else if (newBannerBgPreset === 'amber') {
                      bgGradient = 'from-amber-500/10 via-transparent to-transparent';
                      borderColor = 'border-amber-500/25';
                      badgeBg = 'bg-amber-500/15 text-amber-400';
                    } else if (newBannerBgPreset === 'blue') {
                      bgGradient = 'from-[#0088cc]/10 via-transparent to-transparent';
                      borderColor = 'border-[#0088cc]/25';
                      badgeBg = 'bg-[#0088cc]/15 text-[#33b1ff]';
                    }

                    if (editingBannerId) {
                      // Update existing banner
                      const updated = (systemSettings.promoBanners || []).map(x =>
                        x.id === editingBannerId
                          ? {
                              ...x,
                              title: newBannerTitle.trim(),
                              subtitle: newBannerSubtitle.trim() || undefined,
                              badge: newBannerBadge.trim().toUpperCase() || undefined,
                              bgGradient,
                              borderColor,
                              badgeBg,
                              actionUrl: newBannerActionUrl.trim() || undefined,
                              actionText: newBannerActionText.trim() || undefined
                            }
                          : x
                      );
                      onUpdateSettings({ ...systemSettings, promoBanners: updated });
                      alert('Woohoo! Promotional banner successfully updated and published to the live user dashboards!');
                      setEditingBannerId(null);
                    } else {
                      // Create new banner
                      const newAd: PromoBannerAd = {
                        id: 'ad-' + Date.now().toString(36),
                        title: newBannerTitle.trim(),
                        subtitle: newBannerSubtitle.trim() || undefined,
                        badge: newBannerBadge.trim().toUpperCase() || undefined,
                        bgGradient,
                        borderColor,
                        badgeBg,
                        actionUrl: newBannerActionUrl.trim() || undefined,
                        actionText: newBannerActionText.trim() || undefined,
                        active: true
                      };
                      const updated = [...(systemSettings.promoBanners || []), newAd];
                      onUpdateSettings({ ...systemSettings, promoBanners: updated });
                      alert('Woohoo! New promotional campaign banner successfully published live to user feeds!');
                    }

                    // Clear form
                    setNewBannerTitle('');
                    setNewBannerSubtitle('');
                    setNewBannerBadge('');
                    setNewBannerActionUrl('');
                    setNewBannerActionText('');
                  }}
                  className="flex-1 bg-[#7c6cff] hover:bg-[#6a5aef] text-white py-3 rounded-xl font-display font-black text-xs transition-colors border-t border-white/10 select-none cursor-pointer text-center"
                >
                  {editingBannerId ? '💾 Save & Publish Live Changes' : '📢 Publish & Deploy Banner Ads Feed +'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── CPA NETWORK MONITOR PANEL ──────────────── */}
      {bottomTab === 'manage' && activeTab === 'cpa' && (
        <div id="admin-cpa-tab-panel" className="space-y-6 fadeIn">
          {/* Header */}
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
              <div>
                <h3 className="font-display font-black text-sm text-[#f0f0f8] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#a594ff]" />
                  CPALead Network · Conversion Ledger
                </h3>
                <p className="text-xs text-[#9191a8] mt-1">
                  Real-time S2S postback log. All conversions are deduped by <code className="text-[#5aedcc] font-mono">lead_id</code> and credited inside a single atomic InstantDB transaction.
                </p>
              </div>
              <span className="text-[10px] bg-[#3ecf8e]/15 text-[#3ecf8e] px-2.5 py-1 rounded-full font-mono font-bold border border-[#3ecf8e]/20">
                LIVE FEED
              </span>
            </div>

            {/* KPI cards */}
            {(() => {
              const list = cpaConversions || [];
              const total = list.length;
              const totalInr = list.reduce((s, c) => s + (Number(c.payoutInr) || 0), 0);
              const totalUsd = list.reduce((s, c) => s + (Number(c.payoutUsd) || 0), 0);
              const avg = total > 0 ? totalInr / total : 0;
              const today = new Date().toISOString().split('T')[0];
              const todayCount = list.filter(c => (c.createdAt || '').startsWith(today)).length;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  <div className="bg-[#16161f] border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] text-[#9191a8] uppercase font-bold tracking-wider">Conversions</div>
                    <div className="text-xl font-black text-white font-display mt-1" data-testid="cpa-kpi-total">{total}</div>
                  </div>
                  <div className="bg-[#16161f] border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] text-[#9191a8] uppercase font-bold tracking-wider">Total Paid (INR)</div>
                    <div className="text-xl font-black text-[#3ecf8e] font-display mt-1" data-testid="cpa-kpi-inr">₹{totalInr.toFixed(2)}</div>
                  </div>
                  <div className="bg-[#16161f] border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] text-[#9191a8] uppercase font-bold tracking-wider">Network Rev (USD)</div>
                    <div className="text-xl font-black text-[#a594ff] font-display mt-1">${totalUsd.toFixed(2)}</div>
                  </div>
                  <div className="bg-[#16161f] border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] text-[#9191a8] uppercase font-bold tracking-wider">Today</div>
                    <div className="text-xl font-black text-white font-display mt-1 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#3ecf8e]" /> {todayCount}
                    </div>
                  </div>
                  <div className="bg-[#16161f] border border-white/5 rounded-xl p-4 col-span-2 sm:col-span-4">
                    <div className="text-[10px] text-[#9191a8] uppercase font-bold tracking-wider">Avg Reward / Conversion</div>
                    <div className="text-base font-bold text-white font-display mt-1">₹{avg.toFixed(2)}</div>
                  </div>
                </div>
              );
            })()}

            {/* Settings shortcuts */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <div className="text-[9px] uppercase tracking-wider text-[#9191a8] font-bold">Payout Ratio</div>
                <div className="text-white font-bold font-mono mt-0.5">{((systemSettings?.cpaPayoutRatio ?? 0.7) * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <div className="text-[9px] uppercase tracking-wider text-[#9191a8] font-bold">USD → INR</div>
                <div className="text-white font-bold font-mono mt-0.5">₹{(systemSettings?.cpaUsdToInr ?? 83).toFixed(2)}</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <div className="text-[9px] uppercase tracking-wider text-[#9191a8] font-bold">Pts / ₹</div>
                <div className="text-white font-bold font-mono mt-0.5">{systemSettings?.ptsToCashRate ?? 20}</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <div className="text-[9px] uppercase tracking-wider text-[#9191a8] font-bold">Margin</div>
                <div className="text-[#3ecf8e] font-bold font-mono mt-0.5">{(100 - (systemSettings?.cpaPayoutRatio ?? 0.7) * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* Conversion log table */}
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white font-display">Recent Conversions</h4>
              <span className="text-[10px] text-[#5a5a72] font-mono">
                Showing {Math.min(50, (cpaConversions || []).length)} of {(cpaConversions || []).length}
              </span>
            </div>

            {(cpaConversions || []).length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Globe className="w-8 h-8 text-[#5a5a72] mx-auto" />
                <p className="text-sm text-white font-semibold">No conversions yet</p>
                <p className="text-xs text-[#9191a8]">
                  Configure your CPALead postback URL to:<br />
                  <code className="text-[#5aedcc] font-mono text-[10px] mt-2 inline-block px-2 py-1 bg-[#16161f] rounded">
                    https://your-domain/api/cpalead-postback?subid={'{subid}'}&lead_id={'{lead_id}'}&payout={'{payout}'}&password=YOUR_SECRET&campaign_id={'{campaign_id}'}&campaign_name={'{campaign_name}'}&country_iso={'{country_iso}'}&ip_address={'{ip_address}'}
                  </code>
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#16161f] text-[10px] uppercase tracking-wider text-[#9191a8] font-bold">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Date</th>
                      <th className="px-4 py-2.5 text-left">User</th>
                      <th className="px-4 py-2.5 text-left">Campaign</th>
                      <th className="px-4 py-2.5 text-right">USD</th>
                      <th className="px-4 py-2.5 text-right">INR</th>
                      <th className="px-4 py-2.5 text-right">Pts</th>
                      <th className="px-4 py-2.5 text-left">Geo / IP</th>
                      <th className="px-4 py-2.5 text-left">Lead ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[...(cpaConversions || [])]
                      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                      .slice(0, 50)
                      .map(c => (
                        <tr key={c.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5 text-[#9191a8] font-mono text-[10px] whitespace-nowrap">
                            {(c.createdAt || '').replace('T', ' ').slice(0, 16)}
                          </td>
                          <td className="px-4 py-2.5 text-white font-medium">{c.userName || '—'}</td>
                          <td className="px-4 py-2.5 text-[#a594ff] truncate max-w-[180px]" title={c.campaignName}>{c.campaignName}</td>
                          <td className="px-4 py-2.5 text-right text-[#9191a8] font-mono">${Number(c.payoutUsd || 0).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right text-[#3ecf8e] font-mono font-bold">₹{Number(c.payoutInr || 0).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right text-white font-mono">{c.pointsCredited}</td>
                          <td className="px-4 py-2.5 text-[10px] text-[#9191a8]">
                            <span className="bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">{c.countryIso}</span>
                            <span className="ml-2 font-mono">{c.ipAddress || '—'}</span>
                          </td>
                          <td className="px-4 py-2.5 text-[10px] text-[#5a5a72] font-mono truncate max-w-[120px]" title={c.leadId}>{c.leadId}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {editingUser && (
        <div id="edit-user-modal-backdrop" className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1f2e] border border-white/10 rounded-3xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-display font-extrabold text-[#f0f0f8] text-sm">✏️ Manage User Properties</h3>
                <span className="text-[9px] text-[#9191a8] font-mono block">ID: {editingUser.id}</span>
              </div>
              <button 
                id="close-edit-user-btn"
                onClick={() => setEditingUser(null)}
                className="text-[#9191a8] hover:text-[#f0f0f8] text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateUserFields(editingUser.id, {
                fname: editFname,
                lname: editLname,
                points: Number(editPoints),
                balance: Number(editBalance),
                refs: Number(editRefs),
                tasksCompleted: Number(editTasksCompleted),
                role: editRole,
                refBy: editRefBy.trim() === '' ? null : editRefBy.trim()
              });
              setEditingUser(null);
            }} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-[#9191a8] uppercase font-bold font-mono">First Name</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-[#151522] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
                    value={editFname}
                    onChange={(e) => setEditFname(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-[#9191a8] uppercase font-bold font-mono">Last Name</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-[#151522] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
                    value={editLname}
                    onChange={(e) => setEditLname(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-[#9191a8] uppercase font-bold font-mono">Points (pts)</label>
                  <input 
                    type="number"
                    min={0}
                    className="w-full bg-[#151522] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#7c6cff]"
                    value={editPoints}
                    onChange={(e) => setEditPoints(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-[#9191a8] uppercase font-bold font-mono">Cash (₹)</label>
                  <input 
                    type="number"
                    step={0.01}
                    min={0}
                    className="w-full bg-[#151522] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#7c6cff]"
                    value={editBalance}
                    onChange={(e) => setEditBalance(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-[#9191a8] uppercase font-bold font-mono flex gap-1 items-center" title="Graph Hierarchy Repair Tool (Sponsor/Child Overwrite)">
                    <span>⛓️ Override Sponsor RefBy</span>
                  </label>
                  <input 
                    type="text"
                    className="w-full bg-[#151522] border border-[#a594ff]/30 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#a594ff] focus:outline-none placeholder-[#5a5a72]"
                    placeholder="Leave empty if none"
                    value={editRefBy}
                    onChange={(e) => setEditRefBy(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-[#9191a8] uppercase font-bold font-mono">Total Referrals</label>
                  <input 
                    type="number"
                    min={0}
                    className="w-full bg-[#151522] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
                    value={editRefs}
                    onChange={(e) => setEditRefs(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Downstream Worker Profile Parent Lookup Loop */}
              <div className="bg-[#151522] border border-white/10 rounded-xl p-3 space-y-2 mt-2">
                <span className="text-[9px] text-[#9191a8] uppercase font-bold font-mono border-b border-white/5 pb-1 block">Downstream Worker Network Loop</span>
                <div className="max-h-24 overflow-y-auto scrollbar-none space-y-1 pr-1">
                  {users.filter(x => x.refBy === editingUser.id).length === 0 ? (
                    <span className="text-xs text-[#5a5a72]">No downstream referrals found.</span>
                  ) : (
                    users.filter(x => x.refBy === editingUser.id).map(r => (
                      <div key={r.id} className="text-[10px] text-white flex justify-between bg-black/20 p-1.5 rounded">
                        <span>{r.fname} {r.lname} ({r.id})</span>
                        <span className="text-[#3ecf8e]">{r.points} pts</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-[#9191a8] uppercase font-bold font-mono">Access Role Level</label>
                <select 
                  className="w-full bg-[#151522] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#7c6cff]"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                >
                  <option value="user">Standard User Client</option>
                  <option value="admin">Platform Senior Admin</option>
                </select>
                <p className="text-[8px] text-[#5a5a72]">Promoting users to admin reveals complete analytics controls.</p>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-[#3ecf8e] hover:bg-[#30a872] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bottomTab === 'promot' && (
        <div id="admin-promot-panel" className="space-y-6">
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-black text-sm text-[#f0f0f8] flex items-center gap-2">
              <span>📢 Interactive Promotional Billboard Settings</span>
            </h3>
            <p className="text-xs text-[#9191a8]">Set a customized global announcement styled banner that immediately shines at the very top of all standard users dashboard home screens.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateSettings({
                ...systemSettings,
                promoActive: promoActive,
                promoTitle: promoTitle,
                promoText: promoText
              });
              alert('Promotional billboard parameters successfully updated on client dashboards!');
            }} className="space-y-4">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">Activate Promotional Banner</span>
                  <span className="text-[10px] text-[#5a5a72]">Toggle whether the announcement displays on user dashboards in real-time</span>
                </div>
                <input 
                  type="checkbox" 
                  className="accent-[#7c6cff] h-4 w-4 cursor-pointer"
                  checked={promoActive}
                  onChange={(e) => setPromoActive(e.target.checked)}
                />
              </label>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Promotion Headline</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. ⚡ LIMITED SPECIAL GIFT!"
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Promotion Narrative Detail</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Write a clear notification message guiding users on active events or premium multipliers..."
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] resize-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 rounded-xl font-display font-bold text-xs select-none transition-all hover:opacity-90 cursor-pointer"
                >
                  Apply Promotional Billboard Live update
                </button>
              </div>
            </form>
          </div>

          {/* Promotional Banner Ads Campaign Manager */}
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-display font-black text-sm text-[#f0f0f8] flex items-center gap-2">
                <span>🎨 Dynamic Banner Ads Campaign Manager</span>
              </h3>
              <span className="text-[10px] bg-[#7c6cff]/20 text-[#a594ff] px-2 py-0.5 rounded-full font-mono font-bold">
                Level-3 Active
              </span>
            </div>
            
            <p className="text-xs text-[#9191a8]">Create, toggle, and target customized promotional banners with active external click actions directly onto user landing feeds.</p>

            {/* Current Active Banners List */}
            <div className="space-y-3">
              <h4 className="text-[10px] text-[#9191a8] uppercase tracking-wider font-semibold">Active Campaigns ({systemSettings.promoBanners?.length || 0})</h4>
              
              {(!systemSettings.promoBanners || systemSettings.promoBanners.length === 0) ? (
                <div className="p-4 rounded-xl border border-dashed border-white/5 text-center text-xs text-[#5a5a72]">
                  No banner ad campaigns currently defined. Use the generator form below.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {systemSettings.promoBanners.map((b) => (
                    <div key={b.id} className={`p-4 rounded-xl border relative overflow-hidden bg-gradient-to-r ${b.bgGradient} ${b.borderColor} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                      <div className="space-y-1.5 flex-1 pr-6">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${b.badgeBg}`}>
                            {b.badge || 'PROMO'}
                          </span>
                          {!b.active && (
                            <span className="bg-red-500/15 text-red-400 text-[8px] font-semibold px-1.5 py-0.5 rounded">
                              INACTIVE
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-bold text-white font-display">{b.title}</h5>
                        {b.subtitle && <p className="text-[10px] text-[#9191a8] leading-tight">{b.subtitle}</p>}
                        {b.actionUrl && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[9px] text-[#5a5a72] font-semibold">Redirects to:</span>
                            <span className="text-[9px] text-[#a594ff] truncate font-mono max-w-xs">{b.actionUrl}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t border-white/5 md:border-t-0 pt-2 md:pt-0">
                        <button
                          onClick={() => {
                            const updated = (systemSettings.promoBanners || []).map(x => x.id === b.id ? { ...x, active: !x.active } : x);
                            onUpdateSettings({ ...systemSettings, promoBanners: updated });
                          }}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 select-none cursor-pointer transition-all ${
                            b.active 
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                              : 'bg-white/5 text-[#9191a8] hover:bg-white/10'
                          }`}
                          title={b.active ? 'Disable banner' : 'Enable banner'}
                        >
                          {b.active ? '✓ Active' : '✗ Inactive'}
                        </button>
                        
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this promotional banner campaign?')) {
                              const updated = (systemSettings.promoBanners || []).filter(x => x.id !== b.id);
                              onUpdateSettings({ ...systemSettings, promoBanners: updated });
                            }
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded-lg transition-all cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Campaign Generator Form */}
            <div className="bg-[#16161f] p-4.5 rounded-xl border border-white/5 space-y-4">
              <h4 className="text-[10px] text-[#a594ff] uppercase tracking-wider font-bold">🚀 Add Brand New Banner Campaign</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-[#9191a8] uppercase tracking-wider font-semibold">Banner Heading</label>
                  <input
                    type="text"
                    placeholder="e.g. 🎁 Level 3 Commission Extravaganza!"
                    value={newBannerTitle}
                    onChange={(e) => setNewBannerTitle(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl py-2 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-[#9191a8] uppercase tracking-wider font-semibold">Featured Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. HOT, NEW, COMMUNITY, BOOST"
                    value={newBannerBadge}
                    onChange={(e) => setNewBannerBadge(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl py-2 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] text-[#9191a8] uppercase tracking-wider font-semibold">Description Narrative Subtitle</label>
                  <input
                    type="text"
                    placeholder="Provide short incentive: e.g. Refer friends now and earn up to ₹25 cash for every VIP level-up!"
                    value={newBannerSubtitle}
                    onChange={(e) => setNewBannerSubtitle(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl py-2 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-[#9191a8] uppercase tracking-wider font-semibold">Action Destination Link URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://t.me/earnhub_group"
                    value={newBannerActionUrl}
                    onChange={(e) => setNewBannerActionUrl(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl py-2 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-[#9191a8] uppercase tracking-wider font-semibold">Action Button Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Join TG, Claim Bonus, Refer Friends"
                    value={newBannerActionText}
                    onChange={(e) => setNewBannerActionText(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl py-2 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] text-[#9191a8] uppercase tracking-wider font-semibold">Visual Palette Preset</label>
                  <div className="grid grid-cols-5 gap-2.5 pt-0.5">
                    {[
                      { key: 'purple', label: 'Indigo', bg: 'bg-[#7c6cff]' },
                      { key: 'pink', label: 'Magenta', bg: 'bg-pink-500' },
                      { key: 'emerald', label: 'Forest', bg: 'bg-emerald-500' },
                      { key: 'amber', label: 'Gold', bg: 'bg-amber-500' },
                      { key: 'blue', label: 'Cyan', bg: 'bg-[#0088cc]' },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.key}
                        onClick={() => setNewBannerBgPreset(p.key)}
                        className={`py-2 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                          newBannerBgPreset === p.key 
                            ? 'border-[#7c6cff] bg-[#7c6cff]/10 text-white' 
                            : 'border-white/5 bg-white/[0.02] text-[#9191a8] hover:bg-white/5'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${p.bg} shadow-inner`} />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!newBannerTitle.trim()) {
                    alert('Please enter a heading title for your Banner Campaign.');
                    return;
                  }

                  let bgGradient = 'from-[#7c6cff]/10 via-transparent to-transparent';
                  let borderColor = 'border-[#7c6cff]/25';
                  let badgeBg = 'bg-[#7c6cff]/15 text-[#a594ff]';

                  if (newBannerBgPreset === 'pink') {
                    bgGradient = 'from-pink-500/10 via-transparent to-transparent';
                    borderColor = 'border-pink-500/25';
                    badgeBg = 'bg-pink-500/15 text-pink-400';
                  } else if (newBannerBgPreset === 'emerald') {
                    bgGradient = 'from-emerald-500/10 via-transparent to-transparent';
                    borderColor = 'border-emerald-500/25';
                    badgeBg = 'bg-emerald-500/15 text-emerald-400';
                  } else if (newBannerBgPreset === 'amber') {
                    bgGradient = 'from-amber-500/10 via-transparent to-transparent';
                    borderColor = 'border-amber-500/25';
                    badgeBg = 'bg-amber-500/15 text-amber-400';
                  } else if (newBannerBgPreset === 'blue') {
                    bgGradient = 'from-[#0088cc]/10 via-transparent to-transparent';
                    borderColor = 'border-[#0088cc]/25';
                    badgeBg = 'bg-[#0088cc]/15 text-[#33b1ff]';
                  }

                  const newAd: PromoBannerAd = {
                    id: 'ad-' + Date.now().toString(36),
                    title: newBannerTitle.trim(),
                    subtitle: newBannerSubtitle.trim() || undefined,
                    badge: newBannerBadge.trim().toUpperCase() || undefined,
                    bgGradient,
                    borderColor,
                    badgeBg,
                    actionUrl: newBannerActionUrl.trim() || undefined,
                    actionText: newBannerActionText.trim() || undefined,
                    active: true
                  };

                  const updatedBanners = [...(systemSettings.promoBanners || []), newAd];
                  onUpdateSettings({
                    ...systemSettings,
                    promoBanners: updatedBanners
                  });

                  // Reset local inputs
                  setNewBannerTitle('');
                  setNewBannerSubtitle('');
                  setNewBannerBadge('');
                  setNewBannerActionUrl('');
                  setNewBannerActionText('');
                  alert('Woohoo! Dynamic promotional campaign successfully generated and published live!');
                }}
                className="w-full bg-[#7c6cff]/20 hover:bg-[#7c6cff]/30 text-white py-2.5 rounded-xl font-display font-semibold text-xs border border-[#7c6cff]/30 transition-all cursor-pointer select-none text-center block mt-1"
              >
                Publish Campaign Live Banner +
              </button>
            </div>
          </div>

          {/* Global push notification center */}
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-black text-sm text-[#f0f0f8] flex items-center gap-2">
              <span>📣 Broadcast Announcement</span>
            </h3>
            <p className="text-xs text-[#9191a8]">
              Push a notification to every active member — plain text, or attach an image / video / link. Useful for product updates, contests, payouts, maintenance, etc.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!notifMessage.trim()) return;
                onAddNotification?.({
                  message: notifMessage.trim(),
                  mediaUrl: notifMediaUrl.trim() || undefined,
                  mediaType: notifMediaType === 'auto' ? undefined : notifMediaType,
                  linkUrl: notifLinkUrl.trim() || undefined,
                  icon: notifIcon,
                });
                setNotifMessage('');
                setNotifMediaUrl('');
                setNotifMediaType('auto');
                setNotifLinkUrl('');
                setNotifIcon('📢');
                setNotifUploadPreview('');
              }}
              className="space-y-4"
            >
              {/* Icon picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {['📢','🎉','💸','🎁','⚡','🚀','🛡️','⚠️','🎯','💎','🔥','📅'].map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNotifIcon(em)}
                      className={`w-9 h-9 rounded-lg text-base transition-all ${notifIcon === em ? 'bg-[#7c6cff]/25 border border-[#7c6cff]' : 'bg-[#16161f] border border-white/10 hover:border-white/20'}`}
                      aria-label={em}
                    >
                      {em}
                    </button>
                  ))}
                  <input
                    type="text"
                    maxLength={4}
                    value={notifIcon}
                    onChange={(e) => setNotifIcon(e.target.value || '📢')}
                    className="w-16 bg-[#16161f] border border-white/10 rounded-lg text-center text-base outline-none focus:border-[#7c6cff]"
                  />
                </div>
              </div>

              {/* Message text */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Message Text</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. New Premium Tasks available — earn up to ₹250 per offer. Tap to start!"
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] resize-none"
                />
              </div>

              {/* Media URL + Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Media URL (image / video) — optional</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/banner.jpg  OR  https://youtu.be/xxx"
                    value={notifMediaUrl}
                    onChange={(e) => { setNotifMediaUrl(e.target.value); setNotifUploadPreview(''); }}
                    className="flex-1 bg-[#16161f] border border-white/12 rounded-xl py-2 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                  <label className="bg-[#16161f] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 px-3 py-2 rounded-xl text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 transition-all">
                    <span>📎</span><span>Upload JPG</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 200_000) {
                          alert('File too large. Use a URL for files > 200KB, or compress the image first.');
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = String(reader.result || '');
                          setNotifMediaUrl(dataUrl);
                          setNotifUploadPreview(dataUrl);
                          setNotifMediaType('image');
                        };
                        reader.readAsDataURL(f);
                      }}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-[#5a5a72] leading-relaxed">
                  Paste any direct image URL (jpg/png/webp), MP4 video URL, or YouTube/Vimeo link. For uploads, max 200 KB — larger files should be hosted externally (Imgur, Cloudinary, etc.) and pasted as URL.
                </p>
              </div>

              {/* Media type override */}
              {notifMediaUrl && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Media Type</label>
                  <div className="flex gap-2">
                    {(['auto','image','video'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNotifMediaType(t)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${notifMediaType === t ? 'bg-[#7c6cff]/25 border border-[#7c6cff] text-[#a594ff]' : 'bg-[#16161f] border border-white/10 text-[#9191a8] hover:text-white'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional CTA link */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Call-to-Action Link — optional</label>
                <input
                  type="url"
                  placeholder="https://your-cta-target.com"
                  value={notifLinkUrl}
                  onChange={(e) => setNotifLinkUrl(e.target.value)}
                  className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                />
              </div>

              {/* Live preview */}
              {(notifMessage || notifMediaUrl) && (
                <div className="bg-[#0f0f17] border border-[#7c6cff]/20 rounded-xl p-3">
                  <div className="text-[9px] uppercase tracking-wider text-[#5a5a72] mb-2 font-semibold">Live Preview</div>
                  <div className="flex gap-2 items-start">
                    <span className="text-lg shrink-0">{notifIcon}</span>
                    <div className="flex-1 min-w-0 space-y-2">
                      {notifMessage && <p className="text-xs text-[#f0f0f8] leading-snug">{notifMessage}</p>}
                      {notifMediaUrl && (notifMediaType === 'video' || /youtube|youtu\.be|vimeo|\.(mp4|webm|ogg|mov)/i.test(notifMediaUrl)) ? (
                        <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center text-[10px] text-[#5a5a72] border border-white/5">
                          🎬 Video attachment
                        </div>
                      ) : notifMediaUrl && (notifUploadPreview || /^data:image\//.test(notifMediaUrl) || /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(notifMediaUrl)) ? (
                        <img src={notifMediaUrl} alt="preview" className="rounded-lg max-h-40 object-cover border border-white/5" />
                      ) : notifMediaUrl ? (
                        <div className="rounded-lg overflow-hidden bg-[#1a1a24] border border-white/5 px-3 py-2 text-[10px] text-[#9191a8] truncate">📎 {notifMediaUrl}</div>
                      ) : null}
                      {notifLinkUrl && (
                        <span className="inline-block text-[10px] text-[#a594ff] underline">{notifLinkUrl}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-[#7c6cff] hover:bg-[#6855ef] text-white px-6 py-2.5 rounded-xl font-display font-bold text-xs select-none transition-all cursor-pointer"
                >
                  🚀 Send Broadcast to All Members
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bottomTab === 'help' && (
        <div id="admin-help-panel" className="space-y-4 animate-fade-in pb-16">
          <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 space-y-2">
            <h3 className="font-display font-black text-sm text-[#f0f0f8] flex items-center gap-2">
              <span>🎟️ Customer Support Ticket & Issue Resolver</span>
            </h3>
            <p className="text-xs text-[#9191a8]">Address reported customer issues in real-time. Replying to a ticket automatically marks it "Resolved" and alerts the target user on their client panel.</p>
          </div>

          <div className="space-y-4">
            {supportTickets.length === 0 ? (
              <div className="text-center py-12 bg-[#1a1a24] border border-white/7 rounded-2xl text-[#5a5a72] text-xs">
                No support tickets have been submitted by platform clients yet.
              </div>
            ) : (
              supportTickets.map(ticket => (
                <div key={ticket.id} className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <span className="text-[9px] text-[#7c6cff] font-mono block font-bold">HELP TICKETS ID: #{ticket.id}</span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">{ticket.subject}</h4>
                      <p className="text-[11px] text-[#9191a8]">By <b>{ticket.userName}</b> ({ticket.userEmail}) · {ticket.createdAt}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ticket.status === 'resolved' ? 'bg-[#3ecf8e]/12 text-[#3ecf8e] border border-[#3ecf8e]/25' : 'bg-orange-500/12 text-[#ffa94d] border border-orange-500/20'
                    }`}>
                      {ticket.status === 'resolved' ? 'Resolved ✓' : 'Pending Action'}
                    </span>
                  </div>

                  <div className="bg-[#16161f] border border-white/5 rounded-xl p-3 text-xs text-[#9191a8] leading-relaxed">
                    "{ticket.message}"
                  </div>

                  {ticket.reply ? (
                    <div className="bg-[#3ecf8e]/5 border-l-2 border-[#3ecf8e] p-3 rounded-r-xl space-y-1">
                      <span className="text-[10px] text-[#3ecf8e] font-bold block">Sent Action Reply:</span>
                      <p className="text-xs text-white/90 italic">"{ticket.reply}"</p>
                    </div>
                  ) : (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const reply = ticketReplyText[ticket.id];
                      if (!reply?.trim()) return;
                      onResolveTicket?.(ticket.id, reply);
                      setTicketReplyText(prev => ({ ...prev, [ticket.id]: '' }));
                      alert('Support reply successfully delivered and ticket marked resolved!');
                    }} className="space-y-2 pt-2">
                      <label className="text-[10px] text-[#9191a8] uppercase tracking-wider block font-semibold">Write Resolution Reply Alert</label>
                      <textarea 
                        required
                        rows={2}
                        placeholder="Type standard resolution details. Ex: 'We reviewed and credited your missing Telegram points.'"
                        value={ticketReplyText[ticket.id] || ''}
                        onChange={(e) => setTicketReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                        className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                      />
                      <button
                        type="submit"
                        className="bg-[#3ecf8e]/12 hover:bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/25 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
                      >
                        ✉ Reply & Solve Issue
                      </button>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ──────────────── BOTTOM NAVIGATION ACTION ROW ──────────────── */}
      <div className="fixed bottom-0 md:left-64 left-0 right-0 z-40 bg-[#16161f]/95 backdrop-blur-md border-t border-white/8 py-3.5 px-6 flex justify-around shadow-2xl rounded-t-3xl pb-6">
        {[
          { id: 'home', label: 'Home', icon: Home, color: 'text-[#3ecf8e]' },
          { id: 'manage', label: 'Manage', icon: Wrench, color: 'text-[#a594ff]', badge: String(submissions.filter(x => x.status === 'pending').length || payouts.filter(x => x.status === 'pending').length ? '!' : '') },
          { id: 'promot', label: 'Promot', icon: Megaphone, color: 'text-amber-400' },
          { id: 'help', label: 'Help', icon: LifeBuoy, color: 'text-emerald-400', badge: String(supportTickets.filter(x => x.status === 'pending').length || '') }
        ].map(btn => (
          <button
            key={btn.id}
            id={`btn-bottom-tab-${btn.id}`}
            onClick={() => {
              setBottomTab(btn.id as any);
              if (btn.id === 'manage') {
                setActiveTab('users');
              }
            }}
            className={`flex flex-col items-center gap-1 relative py-1 px-4 rounded-xl transition-all cursor-pointer ${
              bottomTab === btn.id 
                ? 'bg-white/[0.04] scale-105' 
                : 'opacity-60 hover:opacity-90'
            }`}
          >
            <div className="relative">
              <btn.icon className={`w-5 h-5 ${bottomTab === btn.id ? btn.color : 'text-[#9191a8]'}`} />
              {btn.badge && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 font-bold text-[8px] text-white rounded-full h-3.5 w-3.5 flex items-center justify-center border border-[#16161f]">
                  {btn.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold font-display ${bottomTab === btn.id ? 'text-white' : 'text-[#5a5a72]'}`}>
              {btn.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

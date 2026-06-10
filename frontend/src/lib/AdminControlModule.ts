import { init, tx, id } from '@instantdb/core';

// Initialize Instant DB
const APP_ID = (import.meta as any).env?.VITE_INSTANT_APP_ID || '1e866823-f514-46e8-a996-4655f68ca524';
export const db = init({ appId: APP_ID });

/**
 * 1. GAMIFICATION & RETENTION MANAGEMENT CONTROLLER
 */

// Manually override streak counter
export const updateStreak = async (uid: string, action: 'increment' | 'decrement' | 'reset', exactValue?: number) => {
  const query = { users: { $: { where: { id: uid } } } };
  const resp = await db.queryOnce(query);
  const user: any = resp.data.users[0];
  
  if (!user) throw new Error("User not found");

  let newStreak = user.streakCount || 0;
  if (action === 'increment') newStreak++;
  if (action === 'decrement') newStreak = Math.max(0, newStreak - 1);
  if (action === 'reset') newStreak = exactValue ?? 0;

  await db.transact(tx.users[uid].update({ streakCount: newStreak }));
  return newStreak;
};

// Modify active Daily Check-in Point Multiplier
export const updatePointMultiplier = async (uid: string, multiplier: number) => {
  await db.transact(tx.users[uid].update({ checkInMultiplier: multiplier }));
};

// Evaluate and update user tier badge status dynamically
export const evaluateAndUpdateTier = async (uid: string) => {
  const query = { users: { $: { where: { id: uid } } } };
  const resp = await db.queryOnce(query);
  const user: any = resp.data.users[0];
  
  if (!user) return;
  
  const points = user.points || 0;
  let newTier = 'Bronze';
  if (points >= 15000) newTier = 'Gold';
  else if (points >= 5000) newTier = 'Silver';

  if (user.tier !== newTier) {
    await db.transact(tx.users[uid].update({ tier: newTier }));
  }
  return newTier;
};


/**
 * 2. SYSTEM-WIDE COMMUNICATION & SUPPORT ENGINE
 */

// Global text broadcast function for system announcements
export const broadcastAnnouncement = async (payloadText: string) => {
  // Using a singleton 'config' record for app-wide settings or pushing to a specific collection
  await db.transact(tx.systemConfig['global_config'].update({ 
    System_Announcement: payloadText,
    updatedAt: Date.now()
  }));
};

// Live Support Ticket Resolution workflow (Read/Query)
export const getTicketsByStatus = async (status: 'Open' | 'In-Progress' | 'Resolved') => {
  const query = { Support_Tickets: { $: { where: { status: status } } } };
  const resp = await db.queryOnce(query);
  return resp.data.Support_Tickets;
};

// Reply to a ticket and update state
export const replyToTicket = async (ticketId: string, replyText: string) => {
  const replyObj = {
    id: id(),
    text: replyText,
    timestamp: Date.now(),
    isAdmin: true
  };
  
  // Link reply and optionally update status to In-Progress if it was Open
  await db.transact([
    tx.Support_Tickets[ticketId].update({ status: 'In-Progress', lastRepliedAt: Date.now() }),
    tx.Ticket_Replies[replyObj.id].update(replyObj).link({ ticket: ticketId })
  ]);
};

// Toggle System Maintenance Mode globally
export const toggleMaintenanceMode = async (isMaintenance: boolean) => {
  await db.transact(tx.systemConfig['global_config'].update({ 
    System_Maintenance_Mode: isMaintenance 
  }));
};


/**
 * 3. AUTHENTICATION SECTOR, SECURITY, & NETWORK LOCK OVERRIDES
 */

// Security lookup for device fingerprint collisions
export const checkFingerprintCollisions = async (uid: string) => {
  const query = { user_devices: { $: { where: { userId: uid } } } };
  const resp = await db.queryOnce(query);
  const userDevices = resp.data.user_devices;
  
  // Example logic checking if fingerprints overlap with other accounts
  const fingerprints = userDevices.map((d: any) => d.fingerprint);
  const collisionQuery = { user_devices: { $: { where: { fingerprint: { in: fingerprints } } } } };
  const collisionsResp = await db.queryOnce(collisionQuery);
  
  const suspiciousDevices = collisionsResp.data.user_devices.filter((d: any) => d.userId !== uid);
  return { hasCollisions: suspiciousDevices.length > 0, suspiciousDevices };
};

// Manually purge active auth session tokens via Instant DB custom token revoking or clearing active session records
export const invalidateSession = async (uid: string) => {
  const query = { active_sessions: { $: { where: { userId: uid } } } };
  const resp = await db.queryOnce(query);
  const transactions = resp.data.active_sessions.map((session: any) => 
    tx.active_sessions[session.id].delete()
  );
  if (transactions.length > 0) {
    await db.transact(transactions);
  }
};

// Request override to force-update 2FA status to false
export const reset2FA = async (uid: string) => {
  await db.transact(tx.users[uid].update({ twoFactorEnabled: false }));
};

// Unblock and reset IP Lock marker
export const clearIPLock = async (uid: string) => {
  await db.transact(tx.users[uid].update({ 
    isIPLocked: false,
    lockedIP: null 
  }));
};

// Instant Account Deactivation Lock: flips is_active boolean to false to reject future socket/read requests
export const deactivateAccount = async (uid: string) => {
  await db.transact(tx.users[uid].update({ is_active: false }));
};


/**
 * 4. REALTIME NOTIFICATION INJECTOR & ANALYTICS AUDITOR
 */

// Push a structured notification payload to user's arrays
export const pushNotification = async (uid: string, title: string, description: string) => {
  const notificationId = id();
  await db.transact([
    tx.Notification_Bell[notificationId].update({
      title,
      description,
      timestamp: Date.now(),
      read: false
    }).link({ user: uid })
  ]);
};

// Trigger ledger notification badge explicitly
export const triggerLedgerBadge = async (uid: string, message: string) => {
  await db.transact(tx.users[uid].update({ 
    pendingLedgerAlert: message,
    hasUnreadLedger: true
  }));
};

// Full user ledger extraction and aggregation routine
export const extractAndAggregateLedger = async (uid: string) => {
  // Query all ledger entries associated with the user
  const query = { 
    transactions: { $: { where: { userId: uid } } } 
  };
  
  const resp = await db.queryOnce(query);
  const userTransactions = resp.data.transactions || [];
  
  let aggregated = {
    Total_Task_Income: 0,
    Total_Referral_Bonus: 0,
    Total_Payouts: 0,
    Total_Offerwall_Yield: 0,
    Net_Balance: 0
  };
  
  userTransactions.forEach((t: any) => {
    const amt = parseFloat(t.amount || 0);
    
    if (t.type === 'task') aggregated.Total_Task_Income += amt;
    else if (t.type === 'referral') aggregated.Total_Referral_Bonus += amt;
    else if (t.type === 'offerwall') aggregated.Total_Offerwall_Yield += amt;
    else if (t.type === 'payout' || t.type === 'withdrawal') aggregated.Total_Payouts += Math.abs(amt);
    
    if (t.dir === 1 || t.amount > 0) aggregated.Net_Balance += amt;
    else aggregated.Net_Balance -= Math.abs(amt);
  });
  
  return aggregated;
};

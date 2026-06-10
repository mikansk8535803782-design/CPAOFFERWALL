/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { User } from '../types';

interface ProfileTabProps {
  user: User;
  onUpdateProfile: (updates: Partial<User>) => void;
  toast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function ProfileTab({ user, onUpdateProfile, toast }: ProfileTabProps) {
  const [fname, setFname] = useState(user.fname);
  const [lname, setLname] = useState(user.lname);
  const [email, setEmail] = useState(user.email);
  const [mobile, setMobile] = useState(user.mobile);
  const [upi, setUpi] = useState(user.upi || '');
  const [trc20, setTrc20] = useState(user.trc20 || '');
  const [bep20, setBep20] = useState(user.bep20 || '');


  // Tier calculation based on total earnings
  const tierSystem = () => {
    const pts = user.points || 0;
    if (pts >= 15000) return { name: 'Gold Tier', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', next: 'Maxed Out', progress: 100 };
    if (pts >= 5000) return { name: 'Silver Tier', color: 'text-gray-300', bg: 'bg-gray-300/10 border-gray-300/20', next: '15,000 pts to Gold', progress: (pts / 15000) * 100 };
    return { name: 'Bronze Tier', color: 'text-orange-300', bg: 'bg-orange-300/10 border-orange-300/20', next: '5,000 pts to Silver', progress: (pts / 5000) * 100 };
  };
  const currentTier = tierSystem();

  // Daily Check-in Logic
  const canCheckIn = !user.lastCheckIn || new Date(user.lastCheckIn).toDateString() !== new Date().toDateString();
  const currentStreak = user.streakCount || 0;
  
  const handleCheckIn = () => {
     if (!canCheckIn) return;
     const now = new Date();
     onUpdateProfile({ 
       lastCheckIn: now.toISOString(),
       streakCount: currentStreak + 1,
       points: (user.points || 0) + 100,
       balance: (user.balance || 0) + 1 // Add Re 1 value
     });
     toast('success', `Daily check-in successful! +100 Points added. You are on a ${currentStreak + 1} day streak!`);
  };

  const handleSave = () => {
    if (!fname || !lname || !email || !mobile) {
      toast('error', 'Please fill in all core fields.');
      return;
    }

    if (trc20 && (trc20.length !== 34 || !trc20.startsWith('T'))) {
      toast('error', 'USDT TRC20 address must be 34 characters and start with "T".');
      return;
    }

    if (bep20 && (bep20.length !== 42 || !bep20.startsWith('0x'))) {
      toast('error', 'USDT BEP20 address must be 42 characters and start with "0x".');
      return;
    }

    onUpdateProfile({
      fname,
      lname,
      email,
      mobile,
      upi,
      trc20,
      bep20
    });
    toast('success', 'Profile and payout methods updated successfully!');
  };

  return (
    <div className="fadeIn space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card avatar */}
        <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 text-center flex flex-col justify-between items-center space-y-4">
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7c6cff] to-[#5aedcc] uppercase font-bold text-white text-3xl flex items-center justify-center shadow-lg">
              {user.fname[0] + user.lname[0]}
            </div>
            <div>
              <h3 className="font-display font-extrabold text-[#f0f0f8] text-lg">{user.fname} {user.lname}</h3>
              <p className="text-xs text-[#9191a8]">{user.email}</p>
            </div>
          </div>

          <div className={`border px-3.5 py-1.5 rounded-full text-xs font-bold ${currentTier.bg} ${currentTier.color}`}>
            🏆 {currentTier.name}
          </div>

          <div className="w-full text-left space-y-2 pt-2 border-t border-white/5">
            <div className="flex justify-between text-[11px] font-display">
               <span className="text-[#9191a8]">Tier Progress</span>
               <span className={currentTier.color}>{currentTier.next}</span>
            </div>
            <div className="w-full bg-[#16161f] h-2 rounded-full overflow-hidden">
               <div className={`h-full rounded-full bg-current ${currentTier.color}`} style={{ width: `${currentTier.progress}%` }} />
            </div>
          </div>
          
          <div className="w-full pt-4 border-t border-white/5 space-y-3">
             <div className="flex justify-between items-center text-xs">
                <span className="text-[#f0f0f8] font-bold">Daily Streak</span>
                <span className="text-[#a594ff] font-mono">🔥 {currentStreak} Days</span>
             </div>
             
             <div className="flex gap-1.5 justify-between">
                {[1,2,3,4,5,6,7].map(day => (
                   <div key={day} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${day <= (currentStreak % 7 || (currentStreak > 0 ? 7 : 0)) ? 'bg-[#ff7b72]/20 text-[#ff7b72] border border-[#ff7b72]/30' : 'bg-[#16161f] text-[#5a5a72] border border-white/5'}`}>
                      {day}
                   </div>
                ))}
             </div>
             
             <button
               onClick={handleCheckIn}
               disabled={!canCheckIn}
               className={`w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${canCheckIn ? 'bg-gradient-to-r from-[#ff7b72] to-[#ffa94d] text-[#0a0a0f] hover:brightness-110 shadow-[0_0_15px_rgba(255,123,114,0.3)]' : 'bg-[#16161f] text-[#5a5a72]'}`}
             >
               {canCheckIn ? 'Claim Daily Reward' : '✓ Already Claimed Today'}
             </button>
          </div>
        </div>

        {/* Account Edit Fields */}
        <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-6 md:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-sm text-[#f0f0f8]">Account Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#9191a8] font-medium block">First Name</label>
              <input
                id="profile-fname-input"
                type="text"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#9191a8] font-medium block">Last Name</label>
              <input
                id="profile-lname-input"
                type="text"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
                className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#9191a8] font-medium block">Email Address</label>
              <input
                id="profile-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#16161f] border border-[#1a1a24] rounded-xl py-2.5 px-3 text-xs text-[#9191a8] outline-none cursor-not-allowed"
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#9191a8] font-medium block">Mobile Number</label>
              <input
                id="profile-mobile-input"
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-4">
            <h3 className="font-display font-bold text-sm text-[#f0f0f8]">Associated Payment Methods</h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[#9191a8] font-medium block">UPI Address (Google Pay / PhonePe / Paytm)</label>
                <input
                  id="profile-upi-input"
                  type="text"
                  placeholder="e.g. rahul@okicici"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#9191a8] font-medium block">USDT TRC20 Address</label>
                  <input
                    id="profile-trc20-input"
                    type="text"
                    placeholder="e.g. T... (34 characters)"
                    value={trc20}
                    onChange={(e) => setTrc20(e.target.value)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#9191a8] font-medium block">USDT BEP20 Address</label>
                  <input
                    id="profile-bep20-input"
                    type="text"
                    placeholder="e.g. 0x... (42 characters)"
                    value={bep20}
                    onChange={(e) => setBep20(e.target.value)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            id="save-profile-btn"
            onClick={handleSave}
            className="bg-[#7c6cff] hover:bg-[#6a5aef] text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all font-display mt-2"
          >
            💾 Save Changes
          </button>
        </div>
      </div>

      {/* Global Earnings Leaderboard Grid */}
      <div className="bg-[#1a1a24] border border-[#ffb84d]/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#ffb84d]/10 blur-3xl rounded-full pointer-events-none" />
        <h3 className="font-display font-bold text-sm text-[#f0f0f8] relative z-10 flex items-center gap-2 mb-4">
           🌍 Top Earners Leaderboard
        </h3>
        
        <div className="overflow-x-auto rounded-xl border border-white/5 relative z-10 shadow-inner">
           <table className="w-full text-left text-xs border-collapse">
              <thead>
                 <tr className="bg-[#111118] text-[#9191a8] border-b border-white/5">
                    <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Rank</th>
                    <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">User</th>
                    <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Tier Badge</th>
                    <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px] text-right">Points Earned</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#1a1a24]">
                 {/* Top Earner 1 */}
                 <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-bold text-center w-12"><span className="text-xl">🥇</span></td>
                    <td className="p-3.5 font-medium text-white flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-display text-[10px]">A</div>
                       Alexiastone
                    </td>
                    <td className="p-3.5">
                       <span className="px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase bg-yellow-400/10 text-yellow-400 border-yellow-400/20">Platinum</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#5aedcc]">254,800</td>
                 </tr>
                 {/* Top Earner 2 */}
                 <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-bold text-center w-12"><span className="text-xl">🥈</span></td>
                    <td className="p-3.5 font-medium text-white flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-gray-300/20 text-gray-300 flex items-center justify-center font-display text-[10px]">J</div>
                       Jokernode
                    </td>
                    <td className="p-3.5">
                       <span className="px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase bg-yellow-400/10 text-yellow-400 border-yellow-400/20">Gold</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#5aedcc]">112,400</td>
                 </tr>
                 {/* Top Earner 3 */}
                 <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-bold text-center w-12"><span className="text-xl">🥉</span></td>
                    <td className="p-3.5 font-medium text-white flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-orange-400/20 text-orange-400 flex items-center justify-center font-display text-[10px]">M</div>
                       MysticX
                    </td>
                    <td className="p-3.5">
                       <span className="px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase bg-gray-300/10 text-gray-300 border-gray-300/20">Silver</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#5aedcc]">89,900</td>
                 </tr>
                 {/* Current User Pos */}
                 <tr className="bg-[#7c6cff]/5 border-t border-[#7c6cff]/20">
                    <td className="p-3.5 font-bold text-center text-[#a594ff] w-12">#412</td>
                    <td className="p-3.5 font-medium text-[#f0f0f8] flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-[#7c6cff] text-white flex items-center justify-center font-display text-[10px] uppercase">{user.fname[0]}</div>
                       {user.fname} {user.lname} (You)
                    </td>
                    <td className="p-3.5">
                       <span className={`px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase ${currentTier.bg} ${currentTier.color}`}>{currentTier.name.replace(' Tier','')}</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#3ecf8e]">{user.points?.toLocaleString() || 0}</td>
                 </tr>
              </tbody>
           </table>
        </div>
      </div>

      {/* In-App Support Ticket Creation System */}
      <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-bold text-sm text-[#f0f0f8] flex items-center gap-2">
           <span className="text-[#a594ff]">🎫</span> Contact Support
        </h3>
        <p className="text-xs text-[#9191a8] leading-relaxed">
          Need help? Submit a dedicated ticket. Our support staff usually replies within 24 hours. (For instant help, use the floating chat widget).
        </p>
        <form 
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const target = e.target as HTMLFormElement;
            toast('success', "Support ticket successfully submitted! ID: #" + Math.floor(Math.random() * 10000));
            target.reset();
          }}
        >
          <select required className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] appearance-none">
            <option value="">Select Topic...</option>
            <option value="Payment Issue">Payment Issue</option>
            <option value="Task Approval Error">Task Approval Error</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Other">Other</option>
          </select>
          <textarea required rows={3} placeholder="Describe your issue..." className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] resize-none"></textarea>
          <button type="submit" className="bg-[#7c6cff] hover:bg-[#6a5aef] text-[#0a0a0f] px-6 py-2.5 rounded-xl font-bold font-display text-xs transition duration-200 w-full sm:w-auto">
            Submit Support Ticket
          </button>
        </form>
      </div>
    </div>
  );
}

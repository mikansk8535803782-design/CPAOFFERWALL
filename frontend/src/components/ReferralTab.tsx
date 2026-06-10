/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Copy, Share2, Award, Users, TrendingUp, HelpCircle, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { User, Referral } from '../types';

interface ReferralTabProps {
  user: User;
  referrals: Referral[];
  toast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onLinkSponsor?: (sponsorId: string) => void;
}

export default function ReferralTab({ user, referrals, toast, onLinkSponsor }: ReferralTabProps) {
  const [sponsorInput, setSponsorInput] = useState('');
  
  const l1 = referrals.filter(r => r.level === 1);
  const l2 = referrals.filter(r => r.level === 2);
  const l3 = referrals.filter(r => r.level === 3);

  const totalComm = referrals.reduce((sum, r) => sum + r.comm, 0);

  const copyReferralLink = () => {
    const link = `https://earnhub.in/ref/${user.refCode}`;
    navigator.clipboard.writeText(link).then(
      () => toast('success', 'Personal Referral Link copied to clipboard!'),
      () => toast('info', 'Link: ' + link)
    );
  };

  const shareReferral = () => {
    const link = `https://earnhub.in/ref/${user.refCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'EarnHub — Complete tasks. Earn real money!',
        text: 'Join today and start earning via micro-tasks, CPA offers & multi-level referrals.',
        url: link
      }).catch(() => {});
    } else {
      copyReferralLink();
    }
  };

  const handleLinkSponsor = () => {
    if (!sponsorInput.trim()) {
      toast('error', 'Please enter a valid Sponsor UID');
      return;
    }
    if (sponsorInput.trim() === user.refCode) {
      toast('error', 'You cannot sponsor yourself');
      return;
    }
    onLinkSponsor?.(sponsorInput.trim());
    setSponsorInput('');
  };

  return (
    <div className="fadeIn space-y-6">
      {/* Top row options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Code section */}
        <div className="bg-[#1a1a24] border border-[#a594ff]/20 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#a594ff]/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 flex-1 space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm text-[#f0f0f8]">Personal Referral Link Generator</h3>
              <p className="text-xs text-[#9191a8] mt-1">Generate and distribute your unique referral track link.</p>
            </div>
            
            <div className="bg-[#16161f] border border-white/10 rounded-xl p-3 font-mono text-xs text-[#5aedcc] break-all select-all flex justify-between items-center gap-2">
              <span>earnhub.in/ref/{user.refCode}</span>
            </div>
            <div className="flex gap-2.5">
              <button
                id="copy-ref-link-btn"
                onClick={copyReferralLink}
                className="bg-[#7c6cff] hover:bg-[#6a5aef] text-white py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all font-display flex-1 shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" /> Text Copy Key
              </button>
              <button
                id="share-ref-link-btn"
                onClick={shareReferral}
                className="bg-[#16161f] border border-white/10 hover:border-[#7c6cff] text-white py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all font-display shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-4 mt-2 space-y-3 relative z-10">
            <div>
              <h3 className="font-display font-bold text-sm text-[#f0f0f8]">Unique Parent Sponsor UID Input Field</h3>
              <p className="text-xs text-[#9191a8] mt-1">Link your account to an upstream sponsor to activate bonuses.</p>
            </div>
            
            {user.refBy ? (
              <div className="bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 rounded-xl p-3 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#3ecf8e] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-display font-bold text-white">Sponsor Linked Successfully</span>
                  <span className="text-[10px] text-[#3ecf8e] font-mono">UID: {user.refBy}</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9191a8]" />
                  <input
                    type="text"
                    placeholder="Enter Sponsor UID..."
                    value={sponsorInput}
                    onChange={(e) => setSponsorInput(e.target.value)}
                    className="w-full bg-[#16161f] border border-white/10 focus:border-[#7c6cff] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-[#9191a8] outline-none transition-all font-mono"
                  />
                </div>
                <button
                  onClick={handleLinkSponsor}
                  className="bg-[#16161f] border border-white/10 hover:bg-[#7c6cff]/20 hover:border-[#7c6cff] hover:text-[#a594ff] text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Network Stats */}
        <div className="bg-[#1a1a24] border border-[#3ecf8e]/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#3ecf8e]/5 blur-3xl rounded-full pointer-events-none" />
          <h3 className="font-display font-bold text-sm text-[#f0f0f8] relative z-10">Multi-Level Viral Referral Tracker</h3>
          
          <div className="grid grid-cols-3 gap-3 relative z-10">
            <div className="bg-[#16161f] border border-white/5 p-3 rounded-xl text-center space-y-1 shadow-sm">
              <span className="text-[20px] block font-display text-[#3ecf8e] font-bold">{l1.length}</span>
              <span className="text-[9px] text-[#9191a8] uppercase font-display block">L1 Sponsor</span>
            </div>
            <div className="bg-[#16161f] border border-white/5 p-3 rounded-xl text-center space-y-1 shadow-sm">
              <span className="text-[20px] block font-display text-[#a594ff] font-bold">{l2.length}</span>
              <span className="text-[9px] text-[#9191a8] uppercase font-display block">L2 Network</span>
            </div>
            <div className="bg-[#16161f] border border-white/5 p-3 rounded-xl text-center space-y-1 shadow-sm">
              <span className="text-[20px] block font-display text-[#5aedcc] font-bold">{l3.length}</span>
              <span className="text-[9px] text-[#9191a8] uppercase font-display block">L3 Network</span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3.5 space-y-2 relative z-10">
             <div className="flex items-center justify-between text-xs">
                <span className="text-[#9191a8]">Level 1 (Direct)</span>
                <span className="bg-[#3ecf8e]/12 text-[#3ecf8e] px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider">10% CUMULATIVE</span>
             </div>
             <div className="flex items-center justify-between text-xs">
                <span className="text-[#9191a8]">Level 2 (In-direct)</span>
                <span className="bg-[#5aedcc]/12 text-[#5aedcc] px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider">5% CUMULATIVE</span>
             </div>
             <div className="flex items-center justify-between text-xs">
                <span className="text-[#9191a8]">Level 3 (In-direct)</span>
                <span className="bg-[#7c6cff]/12 text-[#a594ff] px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider">2% CUMULATIVE</span>
             </div>
          </div>

          <div className="border-t border-white/5 pt-3.5 flex justify-between items-center relative z-10">
            <span className="text-xs text-[#9191a8]">Total Network Reward Earnings</span>
            <span className="text-[#3ecf8e] font-display font-extrabold text-base">₹{totalComm.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Visual Referral Tree diagram */}
      <div className="bg-[#1a1a24] border border-[#5aedcc]/20 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 relative z-10">
           <Users className="w-5 h-5 text-[#5aedcc]" />
           <div>
            <h3 className="font-display font-bold text-sm text-[#f0f0f8]">Dynamic Relational Hierarchy Tree Viewer</h3>
            <p className="text-xs text-[#9191a8]">Referred Child Users List structure map</p>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#5aedcc]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="w-full overflow-x-auto scrollbar-thin pb-2 relative z-10">
          <div className="ref-tree-wrap min-w-[480px] bg-[#111118]/50 p-6 rounded-xl border border-white/5">
            <div className="ref-node you shadow-md shadow-[#3ecf8e]/10 border-[#3ecf8e]/30">👤 You ({user.fname})</div>
            <div className="ref-connector-v bg-[#3ecf8e]/20"></div>
            
            {/* L1 Horizontal Row */}
            <div className="ref-level">
              {l1.map((r, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="ref-node border-[#7c6cff]/20 bg-[#1a1a24] shadow-sm">{r.name.split(' ')[0]}</div>
                  <span className="ref-pts text-[9px] bg-[#3ecf8e]/10 text-[#3ecf8e] px-1.5 py-0.5 rounded mt-1">+₹{r.comm.toFixed(1)}</span>
                </div>
              ))}
            </div>

            {l2.length > 0 && (
              <>
                <div className="ref-connector-v bg-[#7c6cff]/20"></div>
                {/* L2 Row */}
                <div className="ref-level">
                  {l2.map((r, idx) => (
                    <div key={idx} className="flex flex-col items-center relative">
                      <div className="ref-node border-white/5 bg-[#1a1a24] text-[10px] min-w-[90px] py-1.5 px-3">
                        {r.name.split(' ')[0]}
                      </div>
                      <span className="ref-pts text-[9px] bg-[#5aedcc]/10 text-[#5aedcc] px-1.5 py-0.5 rounded mt-1">+₹{r.comm.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detailed table of sponsors */}
      <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4 shadow-sm">
        <div>
           <h3 className="font-display font-bold text-sm text-[#f0f0f8]">Passive Bonus Points Network Log Grid</h3>
           <p className="text-xs text-[#9191a8]">Comprehensive log of all referred network participants mapping recursive commission distributions.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/5 shadow-inner">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#111118] text-[#9191a8] border-b border-white/5">
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">User Name</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Level</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Joined Date</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px] text-center">Tasks Done</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px] text-right">Commission Earned</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#1a1a24]">
              {referrals.map((r, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5 font-medium text-white flex items-center gap-2">
                     <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center font-display text-[9px] uppercase tracking-wider border border-white/10 shrink-0">
                        {r.name.substring(0, 1)}
                     </div>
                     {r.name}
                  </td>
                  <td className="p-3.5">
                    <span className={`badge px-2.5 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase ${
                      r.level === 1 ? 'bg-[#3ecf8e]/12 text-[#3ecf8e] border-[#3ecf8e]/20' :
                      r.level === 2 ? 'bg-[#5aedcc]/12 text-[#5aedcc] border-[#5aedcc]/20' :
                      'bg-[#7c6cff]/12 text-[#a594ff] border-[#7c6cff]/20'
                    }`}>
                      Tier {r.level}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#9191a8] font-mono text-[10px]">{r.joined}</td>
                  <td className="p-3.5 text-center text-white font-medium">{r.tasksDone}</td>
                  <td className="p-3.5 text-right font-bold text-[#3ecf8e] font-display text-sm tracking-tight">+₹{r.comm.toFixed(2)}</td>
                  <td className="p-3.5">
                    <span className={`badge px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase ${
                      r.tasksDone > 50 ? 'bg-orange-500/12 text-[#ffa94d] border-orange-500/20' : 'bg-[#3ecf8e]/12 text-[#3ecf8e] border-[#3ecf8e]/20'
                    }`}>
                      {r.tasksDone > 50 ? '⚠ VELOCITY' : 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                 <tr>
                    <td colSpan={6} className="p-10 text-center text-[#9191a8] text-xs">
                       No referrals in your network log grid yet.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral Commission Active Audit Log Timeline */}
      <div className="bg-[#1a1a24] border border-[#a594ff]/20 rounded-2xl p-6 space-y-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#a594ff]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h3 className="font-display font-bold text-sm text-[#f0f0f8]">Referral Commission Active Audit Log Timeline</h3>
          <p className="text-xs text-[#9191a8] mt-1">Real-time chronicle of downline commission settlements.</p>
        </div>
        
        <div className="relative z-10 pl-2">
           <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#7c6cff]/20 before:via-white/10 before:to-transparent">
             {[
               { id: 1, node: "JohnDoe", desc: "L1 Task Completion Yield", amount: 15.5, time: "2 hours ago", status: "cleared" },
               { id: 2, node: "Alexia2", desc: "L2 Offerwall Passive Yield", amount: 2.25, time: "5 hours ago", status: "cleared" },
               { id: 3, node: "Skyline99", desc: "L1 Registration Bonus", amount: 50.0, time: "1 day ago", status: "cleared" }
             ].map((log, idx) => (
               <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                 {/* Timeline marker */}
                 <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-[#1a1a24] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md relative z-10 bg-[#7c6cff]">
                   <div className="w-1.5 h-1.5 bg-[#1a1a24] rounded-full"></div>
                 </div>
                 
                 {/* Card */}
                 <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#111118] p-4 rounded-xl border border-white/5 shadow-sm">
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] text-[#9191a8] font-mono">{log.time}</span>
                     <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/20">
                       {log.status}
                     </span>
                   </div>
                   <div className="flex justify-between items-end">
                     <div className="space-y-1">
                       <div className="font-medium text-xs text-white leading-tight">{log.desc} <span className="text-[#a594ff]">(@{log.node})</span></div>
                     </div>
                     <div className="text-sm font-bold font-display text-[#3ecf8e]">
                       +₹{log.amount.toFixed(2)}
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

    </div>
  );
}

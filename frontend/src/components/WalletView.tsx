/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { User, Transaction, WithdrawRequest, SystemSettings } from '../types';

interface WalletProps {
  user: User;
  transactions: Transaction[];
  payouts: WithdrawRequest[];
  onWithdraw: (amount: number, method: string, dest: string) => void;
  toast: (type: 'success' | 'error' | 'info', msg: string) => void;
  systemSettings: SystemSettings;
}

export default function WalletView({ user, transactions, payouts, onWithdraw, toast, systemSettings }: WalletProps) {
  const [showModal, setShowModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'trc20' | 'bep20' | ''>('');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Update default destination when method changes
  useEffect(() => {
    if (withdrawMethod === 'upi') {
      setWithdrawDest(user.upi || '');
    } else if (withdrawMethod === 'trc20') {
      setWithdrawDest(user.trc20 || '');
    } else if (withdrawMethod === 'bep20') {
      setWithdrawDest(user.bep20 || '');
    } else {
      setWithdrawDest('');
    }
  }, [withdrawMethod, user]);

  const validateAddress = (method: string, address: string) => {
    if (!address) return false;
    if (method === 'upi') {
       // Alphanumeric Local UPI Handle Text Validator (GPay / PhonePe / Paytm)
       return /^[a-zA-Z0-9.-]+@[a-zA-Z0-9]+$/.test(address);
    }
    if (method === 'trc20' || method === 'bep20') {
       // Crypto Network String Layout Pattern Scanner (USDT TRC20 / BEP20)
       if (method === 'trc20') return address.length === 34 && address.startsWith('T');
       if (method === 'bep20') return address.length === 42 && address.startsWith('0x');
    }
    return false;
  };

  const handleWithdrawSubmit = () => {
    if (!withdrawMethod) {
      toast('error', 'Please select a withdrawal method.');
      return;
    }
    
    if (!validateAddress(withdrawMethod, withdrawDest)) {
      const hints = {
        upi: 'Valid UPI format: handle@bank',
        trc20: 'TRC20 must start with "T" and be 34 characters',
        bep20: 'BEP20 must start with "0x" and be 42 characters'
      };
      toast('error', 'Invalid address. ' + hints[withdrawMethod]);
      return;
    }

    const amt = parseFloat(withdrawAmount);
    const minW = systemSettings?.minWithdrawal || 100;
    if (isNaN(amt) || amt < minW) {
      toast('error', `Minimum withdrawal amount is ₹${minW}.`);
      return;
    }

    if (amt > user.balance) {
      toast('error', 'Insufficient balance directly inside your wallet.');
      return;
    }

    onWithdraw(amt, withdrawMethod.toUpperCase(), withdrawDest);
    setShowModal(false);
    setWithdrawAmount('');
    setWithdrawMethod('');
  };

  const getMethodDetails = () => {
    switch (withdrawMethod) {
      case 'upi':
        return {
          label: 'UPI Address',
          placeholder: 'yourname@upi',
          note: '⚡ UPI transfers are instant (usually within seconds).'
        };
      case 'trc20':
        return {
          label: 'USDT TRC20 Address (34 chars)',
          placeholder: 'T... (starts with T)',
          note: '🔗 TRC20 transfers: 5-30 mins. Min: $5 equiv.'
        };
      case 'bep20':
        return {
          label: 'USDT BEP20 Address (0x, 42 chars)',
          placeholder: '0x...',
          note: '🔗 BEP20 transfers: 5-30 mins. Min: $5 equiv.'
        };
      default:
        return {
          label: 'Destination Address',
          placeholder: 'Enter payment identity',
          note: ''
        };
    }
  };

  const methodInfo = getMethodDetails();

  return (
    <div className="fadeIn space-y-6">
      {/* Wallet overview card */}
      <div className="bg-gradient-to-br from-[#7c6cff]/15 to-[#5aedcc]/7 border border-[#7c6cff]/20 rounded-3xl p-6 md:p-8 text-center space-y-4">
        <span className="text-xs text-[#9191a8] tracking-widest uppercase block font-display">Wallet Balance</span>
        <h2 className="font-display font-extrabold text-[#f0f0f8] text-4xl leading-none">₹{user.balance.toFixed(2)}</h2>
        <p className="text-xs text-[#9191a8]">
          {user.points.toLocaleString()} points · Min withdraw: ₹{systemSettings?.minWithdrawal || 100}
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-2">
          <button
            id="open-withdraw-modal-btn"
            onClick={() => setShowModal(true)}
            className="bg-[#7c6cff] hover:bg-[#6a5aef] text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all font-display"
          >
            💸 Withdraw
          </button>
          <a
            href="#tasks"
            className="bg-[#16161f]/80 border border-white/10 text-white hover:text-[#a594ff] hover:border-[#7c6cff] px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer select-none text-center transition-all font-display"
          >
            ⚡ Earn More
          </a>
        </div>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 text-center">
          <div className="text-[10px] text-[#9191a8] uppercase tracking-widest font-display mb-1">Total Earned</div>
          <div className="font-display text-xl font-bold text-[#3ecf8e]">₹{user.totalEarned.toFixed(2)}</div>
        </div>
        <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 text-center">
          <div className="text-[10px] text-[#9191a8] uppercase tracking-widest font-display mb-1">Total Withdrawn</div>
          <div className="font-display text-xl font-bold text-[#a594ff]">₹{user.totalWithdrawn.toFixed(2)}</div>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-[#1a1a24] border border-white/7 rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-bold text-sm text-[#f0f0f8] flex items-center gap-2">
          <span className="text-[#a594ff]">💳</span> Payout History
        </h3>
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#16161f] text-[#9191a8] border-b border-white/5">
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Date</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Method</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px] text-right">Amount</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#f0f0f8]">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#5a5a72]">No withdrawals yet.</td>
                </tr>
              ) : (
                payouts.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-mono text-[#9191a8] text-[10px]">{p.date}</td>
                    <td className="p-3.5">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="bg-[#7c6cff]/12 text-[#a594ff] px-2 py-0.5 rounded text-[9px] font-semibold border border-[#7c6cff]/20 uppercase tracking-widest">
                          {p.method}
                        </span>
                        <span className="font-mono text-[10px] text-white/50 break-all">{p.dest}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-display font-bold text-[#f0f0f8]">₹{p.amount.toFixed(2)}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                        p.status === 'approved' ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20' :
                        p.status === 'rejected' ? 'bg-red-500/10 text-[#ff4f4f] border border-red-500/20' :
                        'bg-orange-500/10 text-[#ffa94d] border border-orange-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lifetime Earnings Categorized Analytics Chart */}
      <div className="bg-[#1a1a24] border border-[#3ecf8e]/20 rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#3ecf8e]/10 blur-3xl rounded-full pointer-events-none" />
        <h3 className="font-display font-bold text-sm text-[#f0f0f8] relative z-10">Lifetime Earnings Categorized Analytics Chart</h3>
        <p className="text-[10px] text-[#9191a8] relative z-10 mb-4">Breakdown of gross point distribution.</p>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-32 h-32 rounded-full border-[12px] border-[#111118] relative flex items-center justify-center pointer-events-none shadow-xl" style={{ background: 'conic-gradient(#7c6cff 0% 55%, #5aedcc 55% 85%, #ffb84d 85% 100%)' }}>
            <div className="w-24 h-24 bg-[#1a1a24] rounded-full flex flex-col items-center justify-center">
              <span className="text-white font-bold font-mono">100%</span>
              <span className="text-[8px] text-[#5a5a72] uppercase tracking-widest mt-0.5">Yield</span>
            </div>
          </div>
          <div className="flex-1 w-full space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-md bg-[#7c6cff]"></div>
                 <span className="text-xs text-[#f0f0f8]">Offerwalls</span>
               </div>
               <span className="font-mono text-xs text-[#a594ff] font-bold">55%</span>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-md bg-[#5aedcc]"></div>
                 <span className="text-xs text-[#f0f0f8]">Micro Tasks</span>
               </div>
               <span className="font-mono text-xs text-[#3ecf8e] font-bold">30%</span>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-md bg-[#ffb84d]"></div>
                 <span className="text-xs text-[#f0f0f8]">Referral Engine</span>
               </div>
               <span className="font-mono text-xs text-[#ffa94d] font-bold">15%</span>
             </div>
          </div>
        </div>
      </div>

      {/* Live Financial Transaction Ledger Logs Timeline */}
      <div className="bg-[#1a1a24] border border-[#a594ff]/20 rounded-2xl p-6 space-y-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#a594ff]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h3 className="font-display font-bold text-sm text-[#f0f0f8]">Live Financial Transaction Ledger Logs Timeline</h3>
          <p className="text-xs text-[#9191a8] mt-1">Real-time chronicle of all earnings and disbursements.</p>
        </div>
        
        <div className="relative z-10 pl-2">
          {transactions.length === 0 ? (
             <div className="text-center text-[#5a5a72] text-xs py-8 border border-dashed border-white/10 rounded-xl">
                No ledger activity recorded yet.
             </div>
          ) : (
             <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#7c6cff]/20 before:via-white/10 before:to-transparent">
               {transactions.map((t, idx) => (
                 <div key={t.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                   {/* Timeline marker */}
                   <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 border-[#1a1a24] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md relative z-10 ${
                     t.status === 'approved' ? 'bg-[#3ecf8e]' :
                     t.status === 'pending' ? 'bg-[#ffa94d]' :
                     t.status === 'paid' ? 'bg-[#5aedcc]' :
                     t.status === 'refunded' ? 'bg-[#ff4f4f]' :
                     'bg-[#9191a8]'
                   }`}>
                     <div className="w-1.5 h-1.5 bg-[#1a1a24] rounded-full"></div>
                   </div>
                   
                   {/* Card */}
                   <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#111118] p-4 rounded-xl border border-white/5 shadow-sm">
                     <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] text-[#9191a8] font-mono">{t.date}</span>
                       <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${
                         t.status === 'approved' ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/20' :
                         t.status === 'pending' ? 'bg-[#ffa94d]/10 text-[#ffa94d] border-[#ffa94d]/20' :
                         t.status === 'paid' ? 'bg-[#5aedcc]/10 text-[#5aedcc] border-[#5aedcc]/20' :
                         t.status === 'refunded' ? 'bg-[#ff4f4f]/10 text-[#ff4f4f] border-[#ff4f4f]/20' :
                         'bg-white/5 text-white/50 border-white/10'
                       }`}>
                         {t.status === 'approved' ? 'APPROVED' : t.status === 'pending' ? 'PENDING' : t.status === 'paid' ? 'PAID' : t.status === 'refunded' ? 'REFUNDED' : t.status}
                       </span>
                     </div>
                     <div className="flex justify-between items-end">
                       <div className="space-y-1">
                         <div className="font-medium text-xs text-white leading-tight">{t.desc}</div>
                         <div className="text-[9px] uppercase tracking-wider text-[#7c6cff] font-display">{t.type}</div>
                       </div>
                       <div className={`text-sm font-bold font-display ${t.dir === 1 ? 'text-[#3ecf8e]' : 'text-[#ff4f4f]'}`}>
                         {t.dir === 1 ? '+' : '-'}₹{Math.abs(t.amount).toFixed(2)}
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showModal && (
        <div id="withdraw-modal-backdrop" className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1f2e] border border-white/12 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-white/7 pb-4">
              <h3 className="font-display font-bold text-base text-[#f0f0f8]">💸 Withdraw Funds</h3>
              <button 
                id="close-withdraw-modal" 
                onClick={() => setShowModal(false)}
                className="text-[#9191a8] hover:text-[#f0f0f8] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#16161f] rounded-2xl p-4 text-center">
              <span className="text-[10px] text-[#9191a8] uppercase block">Available Balance</span>
              <span className="text-[#3ecf8e] font-display font-bold text-2xl">₹{user.balance.toFixed(2)}</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[#9191a8] font-medium block">Withdrawal Method</label>
                <select
                  id="withdraw-method-select"
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as any)}
                  className="w-full bg-[#16161f] border border-white/12 rounded-xl py-3 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                >
                  <option value="">-- Select Method --</option>
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="trc20">USDT TRC20</option>
                  <option value="bep20">USDT BEP20</option>
                </select>
              </div>

              {withdrawMethod && (
                <div className="space-y-1.5 fadeIn">
                  <label className="text-xs text-[#9191a8] font-medium block">{methodInfo.label}</label>
                  <input
                    id="withdraw-dest-input"
                    type="text"
                    placeholder={methodInfo.placeholder}
                    value={withdrawDest}
                    onChange={(e) => setWithdrawDest(e.target.value)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-3 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff]"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div>
                   <label className="text-xs text-[#9191a8] font-medium block mb-1.5">Total Points Extraction Amount Input Component</label>
                   <input
                     id="withdraw-amount-input"
                     type="number"
                     placeholder={`Min ₹${systemSettings?.minWithdrawal || 100}`}
                     value={withdrawAmount}
                     onChange={(e) => setWithdrawAmount(e.target.value)}
                     className="w-full bg-[#16161f] border border-white/12 rounded-xl py-3 px-3 text-xs text-[#f0f0f8] outline-none focus:border-[#7c6cff] placeholder-white/20"
                   />
                </div>
                {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                   <div className="bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 rounded-xl p-3 flex justify-between items-center text-xs">
                     <span className="text-[#3ecf8e] font-medium">Dynamic Points-to-INR Conversion Calculation Label:</span>
                     <span className="text-white font-mono font-bold">₹{parseFloat(withdrawAmount).toFixed(2)} ({(parseFloat(withdrawAmount) * 100).toLocaleString()} Points)</span>
                   </div>
                )}
              </div>

              {withdrawMethod && methodInfo.note && (
                <div className="bg-[#1a1a24] p-3 rounded-xl border border-white/5 text-[11px] text-[#5a5a72] leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5aedcc] shrink-0 mt-0.5" />
                  <span>{methodInfo.note}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  id="submit-withdraw-confirm-btn"
                  onClick={handleWithdrawSubmit}
                  className="bg-[#7c6cff] hover:bg-[#6a5aef] text-white py-3 px-4 rounded-xl text-xs font-semibold flex-1 text-center cursor-pointer transition-all font-display"
                >
                  Confirm Withdraw
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-[#16161f] border border-white/10 text-white py-3 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all font-display"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

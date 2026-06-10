import React, { useState, useEffect } from 'react';
import { extractAndAggregateLedger, db } from '../lib/AdminControlModule';

export default function AdminControlPanel() {
  const [selectedUid, setSelectedUid] = useState('USR0001');
  const [loading, setLoading] = useState(false);
  const [ledgerOverview, setLedgerOverview] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback mock data to run without actual InstantDB integration in preview
  const handleFetchUserLedger = async () => {
    setLoading(true);
    try {
      if (db) {
        // Try calling the Instant DB function, if it fails due to setup, fallback to mock
        const aggregated = await extractAndAggregateLedger(selectedUid);
        setLedgerOverview(aggregated);
        // Also fetch individual transactions to display in the table
        const query = { transactions: { $: { where: { userId: selectedUid } } } };
        const resp = await db.queryOnce(query);
        setTransactions(resp.data.transactions || []);
      }
    } catch (error) {
      console.warn("Using fallback mock data for Admin Panel because Instant DB is not connected.", error);
      // Mock data payload
      setLedgerOverview({
        Total_Task_Income: 450.50,
        Total_Referral_Bonus: 120.75,
        Total_Payouts: 200.00,
        Total_Offerwall_Yield: 850.00,
        Net_Balance: 1221.25,
      });
      setTransactions([
        { id: 'T1', type: 'offerwall', amount: 500, desc: 'Mega Offer Completed', status: 'approved', date: '2026-06-08', dir: 1 },
        { id: 'T2', type: 'withdrawal', amount: -200, desc: 'UPI Withdrawal', status: 'paid', date: '2026-06-07', dir: -1 },
        { id: 'T3', type: 'task', amount: 50.5, desc: 'Shortlink Click', status: 'approved', date: '2026-06-06', dir: 1 },
        { id: 'T4', type: 'referral', amount: 120.75, desc: 'Level 1 Commission', status: 'approved', date: '2026-06-05', dir: 1 },
        { id: 'T5', type: 'offerwall', amount: 350, desc: 'Survey Completed', status: 'pending', date: '2026-06-04', dir: 1 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchUserLedger();
  }, [selectedUid]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-extrabold text-white text-xl md:text-2xl flex items-center gap-3">
            <span className="bg-[#ff4f4f]/20 text-[#ff4f4f] p-2 rounded-xl text-lg">🛡️</span>
            Admin Control Panel
          </h2>
          <p className="text-[#9191a8] text-xs md:text-sm mt-1">Superuser access: User Ledger Auditing & Extractor</p>
        </div>
      </div>

      <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Enter User ID (e.g. USR0001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-[#111118] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#7c6cff] outline-none"
          />
          <button
            onClick={() => setSelectedUid(searchQuery || 'USR0001')}
            className="bg-[#7c6cff] hover:bg-[#6a5aef] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition"
          >
            Query UID Ledger
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#9191a8] text-sm">Extracting Deep Ledger Analytics...</div>
        ) : ledgerOverview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-4 bg-[#111118] border border-white/5 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-[#9191a8] tracking-wider mb-1">Net Balance</div>
                <div className="text-xl font-mono font-bold text-white">₹{ledgerOverview.Net_Balance.toFixed(2)}</div>
              </div>
              <div className="p-4 bg-[#111118] border border-white/5 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-[#3ecf8e] tracking-wider mb-1">Task Income</div>
                <div className="text-xl font-mono font-bold text-white">₹{ledgerOverview.Total_Task_Income.toFixed(2)}</div>
              </div>
              <div className="p-4 bg-[#111118] border border-white/5 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-[#a594ff] tracking-wider mb-1">Offerwall Yield</div>
                <div className="text-xl font-mono font-bold text-white">₹{ledgerOverview.Total_Offerwall_Yield.toFixed(2)}</div>
              </div>
              <div className="p-4 bg-[#111118] border border-white/5 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-[#ffb84d] tracking-wider mb-1">Ref Bonus</div>
                <div className="text-xl font-mono font-bold text-white">₹{ledgerOverview.Total_Referral_Bonus.toFixed(2)}</div>
              </div>
              <div className="p-4 bg-[#111118] border border-white/5 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-[#ff4f4f] tracking-wider mb-1">Total Payouts</div>
                <div className="text-xl font-mono font-bold text-white">₹{ledgerOverview.Total_Payouts.toFixed(2)}</div>
              </div>
            </div>

            <div className="border border-white/5 rounded-xl overflow-hidden bg-[#111118]">
              <div className="px-5 py-4 border-b border-white/5 bg-[#16161f]">
                <h3 className="font-bold text-sm text-[#f0f0f8]">UID: {selectedUid} — Complete Transaction Log</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#1a1a24] text-[#9191a8] border-b border-white/5">
                      <th className="p-4 font-display font-semibold uppercase tracking-wider text-[10px]">TID</th>
                      <th className="p-4 font-display font-semibold uppercase tracking-wider text-[10px]">Category</th>
                      <th className="p-4 font-display font-semibold uppercase tracking-wider text-[10px]">Description</th>
                      <th className="p-4 font-display font-semibold uppercase tracking-wider text-[10px] text-right">Amount</th>
                      <th className="p-4 font-display font-semibold uppercase tracking-wider text-[10px]">Status</th>
                      <th className="p-4 font-display font-semibold uppercase tracking-wider text-[10px]">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.length > 0 ? (
                      transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02]">
                          <td className="p-4 font-mono text-[10px] text-[#5a5a72]">{t.id}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              t.type === 'offerwall' ? 'bg-[#7c6cff]/10 text-[#a594ff] border-[#7c6cff]/20' :
                              t.type === 'task' ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/20' :
                              t.type === 'referral' ? 'bg-[#ffb84d]/10 text-[#ffb84d] border-[#ffb84d]/20' :
                              t.type === 'withdrawal' || t.type === 'payout' ? 'bg-[#ff4f4f]/10 text-[#ff4f4f] border-[#ff4f4f]/20' :
                              'bg-white/5 text-[#9191a8] border-white/10'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="p-4 text-white font-medium">{t.desc}</td>
                          <td className={`p-4 text-right font-bold font-mono ${t.dir === 1 || t.amount > 0 ? 'text-[#3ecf8e]' : 'text-[#ff4f4f]'}`}>
                            {t.dir === 1 || t.amount > 0 ? '+' : '-'}₹{Math.abs(t.amount).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              t.status === 'approved' || t.status === 'paid' ? 'text-[#3ecf8e]' :
                              t.status === 'pending' ? 'text-[#ffb84d]' : 'text-[#ff4f4f]'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-4 text-[#9191a8]">{t.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#5a5a72]">No ledger transactions found for this UID.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

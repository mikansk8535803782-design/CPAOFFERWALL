/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EarnHelper — the on-app support assistant.
 * Talks to /api/chat for AI replies, with a tight client-side context
 * scoped to the requesting user only. Sensitive fields (UPI, wallet
 * addresses) are masked before they leave the browser.
 */

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../App';
import { User } from '../types';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time?: string;
  id?: string;
}

interface HelpChatbotProps {
  user: User;
  onClose?: () => void;
}

function mask(v: string | undefined, keep = 4): string {
  if (!v) return '';
  const s = String(v);
  if (s.length <= keep) return '•'.repeat(s.length);
  return s.slice(0, keep) + '•'.repeat(Math.min(6, s.length - keep));
}

function timeOnly() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HelpChatbot({ user }: HelpChatbotProps) {
  const firstName = user.fname || 'there';
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: `Hi ${firstName} 👋  I'm EarnHelper — your on-app assistant. I can help with your tasks, withdrawals, coins and referrals. What would you like to know?`,
      time: timeOnly(),
      id: 'welcome-msg',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live queries — own transactions, submissions, payouts
  const { data: dbData, isLoading } = db.useQuery({
    transactions: { $: { where: { userId: user.id } } },
    submissions: { $: { where: { userId: user.id } } },
    payouts: { $: { where: { userId: user.id } } },
  });

  const transactions = (dbData?.transactions as any[]) || [];
  const submissions = (dbData?.submissions as any[]) || [];
  const payouts = (dbData?.payouts as any[]) || [];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Build the AI context once per send — keeps it cheap and consistent.
  const buildContext = () => {
    const lastTask = transactions
      .filter(t => t.type === 'task' || t.type === 'offer' || t.type === 'cpa')
      .slice(-1)[0];
    const lastPayout = payouts.slice(-1)[0];
    const pendingSubs = submissions.filter(s => s.status === 'pending').length;
    const recentTransactions = transactions
      .slice(-5)
      .map(t => ({
        date: t.date,
        type: t.type,
        amount: Number(t.amount || 0),
        pts: Number(t.pts || 0),
        status: t.status,
        desc: String(t.desc || '').slice(0, 80),
      }));

    return {
      name: `${user.fname} ${user.lname}`,
      role: user.role,
      points: user.points,
      balance: user.balance,
      totalEarned: user.totalEarned,
      totalWithdrawn: user.totalWithdrawn,
      tasksCompleted: user.tasksCompleted,
      refs: user.refs,
      upi: mask(user.upi, 4),
      trc20: mask(user.trc20, 6),
      bep20: mask(user.bep20, 6),
      pendingSubmissions: pendingSubs,
      lastTaskStatus: lastTask
        ? `"${lastTask.desc || lastTask.type}" — ${lastTask.status}`
        : 'None',
      lastPayoutStatus: lastPayout
        ? `₹${Number(lastPayout.amount || 0).toFixed(2)} via ${lastPayout.method} — ${lastPayout.status}`
        : 'None',
      recentTransactions,
    };
  };

  // Quick-reply chips — server still handles the actual reply via Gemini
  const QUICK_CHIPS = [
    { text: 'How much can I withdraw?', icon: '💸' },
    { text: 'Show my recent tasks', icon: '📋' },
    { text: 'Last withdrawal status', icon: '🕒' },
    { text: 'How do referrals work?', icon: '🤝' },
    { text: 'How to earn more coins?', icon: '💎' },
  ];

  const handleSend = async (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping) return;

    setMessages(prev => [...prev, { sender: 'user', text, time: timeOnly(), id: 'usr-' + Date.now() }]);
    setIsTyping(true);

    let reply = '';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userContext: buildContext() }),
      });
      if (res.ok) {
        const json = await res.json();
        reply = json.text || '';
      }
    } catch {
      // fall through to local fallback
    }

    if (!reply) {
      reply = isLoading
        ? 'One moment — pulling your latest activity from the database…'
        : `I'm having trouble reaching the assistant right now. You can also raise a ticket from the Support section and a human will reply.`;
    }

    setMessages(prev => [
      ...prev,
      { sender: 'bot', text: reply, time: timeOnly(), id: 'bot-' + Date.now() },
    ]);
    setIsTyping(false);
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const t = inputText;
    setInputText('');
    handleSend(t);
  };

  return (
    <div className="flex flex-col h-full bg-[#1b1b26] text-white">
      {/* Message list */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-none flex flex-col">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[82%] ${
              m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div
              className={`px-3 py-2 text-xs rounded-2xl ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-[#7c6cff] to-[#6a5aef] text-white rounded-br-none'
                  : 'bg-[#111118]/90 border border-white/5 text-[#dcdce6] rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
            </div>
            {m.time && <span className="text-[9px] text-[#5a5a72] mt-0.5 px-1">{m.time}</span>}
          </div>
        ))}

        {isTyping && (
          <div className="self-start bg-[#111118]/60 border border-white/5 px-3.5 py-2 rounded-full text-[10px] text-[#9191a8] flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 bg-[#7c6cff] rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-[#7c6cff] rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-[#7c6cff] rounded-full animate-bounce [animation-delay:0.4s]" />
            <span>EarnHelper is typing</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick-reply chips */}
      <div className="px-3 py-2 bg-[#12121a]/80 border-t border-white/5 flex gap-1.5 overflow-x-auto scrollbar-none select-none shrink-0">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.text}
            onClick={() => handleSend(chip.text)}
            disabled={isTyping}
            data-testid={`chat-chip-${chip.text.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex items-center gap-1 shrink-0 bg-[#7c6cff]/8 text-[#a594ff] hover:bg-[#7c6cff]/15 active:scale-95 border border-[#7c6cff]/20 font-semibold px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <span>{chip.icon}</span>
            <span>{chip.text}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={onSubmitForm}
        className="p-3 bg-[#111118] border-t border-white/5 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isTyping}
          placeholder={isTyping ? 'Waiting for response…' : 'Ask EarnHelper anything about your account…'}
          maxLength={500}
          className="flex-1 bg-[#1a1a24] border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#7c6cff]/50 placeholder-[#5a5a72] transition-colors disabled:opacity-50"
          data-testid="chat-input"
        />
        <button
          type="submit"
          disabled={isTyping || !inputText.trim()}
          data-testid="chat-send-btn"
          className="bg-[#7c6cff] hover:bg-[#6b5bef] active:scale-95 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}

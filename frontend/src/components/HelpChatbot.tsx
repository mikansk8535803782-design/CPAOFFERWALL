/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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

export default function HelpChatbot({ user, onClose }: HelpChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: `Hello ${user.fname}! I am your Instant DB-backed Help Chatbot. How can I assist you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: 'welcome-msg'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live Query user's Task_Ledger and payouts records from Instant DB
  const { data: dbData, isLoading } = db.useQuery({
    Task_Ledger: {
      $: {
        where: { userId: user.id }
      }
    },
    payouts: {
      $: {
        where: { userId: user.id }
      }
    }
  });

  const taskLedgers = (dbData?.Task_Ledger as any[]) || [];
  const payoutsLedger = (dbData?.payouts as any[]) || [];

  // Scroll to bottom whenever messages list modifications happen or when bot typing state shifts
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleAction = async (textStr: string) => {
    const trimmedInput = textStr.trim();
    if (!trimmedInput) return;

    // Acknowledge custom message immediately in the log list
    const userMsg: Message = {
      sender: 'user',
      text: trimmedInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: 'usr-' + Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    let reply = '';

    // Check predefined actions
    if (['Check Last Task Status', 'Withdrawal Status', 'Withdrawal Query', 'Points Conversion Help', 'App Error'].includes(trimmedInput)) {
      // Artificial delay for rule-based matching replies
      await new Promise(resolve => setTimeout(resolve, 800));
      switch (trimmedInput) {
        case 'Check Last Task Status': {
          if (isLoading) {
            reply = 'Querying the Task_Ledger schema in real-time, please wait...';
          } else if (taskLedgers.length === 0) {
            reply = 'No record found under your account in the the Task_Ledger schema. Try in a few moments or perform some tasks first!';
          } else {
            // Take the newest record (based on array position, since we push new entries)
            const latestRecord = taskLedgers[taskLedgers.length - 1];
            const title = latestRecord.taskTitle || 'Unknown Campaign';
            const statusLabel = latestRecord.status || 'Pending';
            reply = `Status Query successfully retrieved! Name: "${title}" | Current Status: [${statusLabel}]`;
          }
          break;
        }
        case 'Withdrawal Status':
        case 'Withdrawal Query': {
          if (isLoading) {
            reply = 'Checking the payouts ledger in real-time. Please wait...';
          } else if (payoutsLedger.length === 0) {
            reply = 'No payout or withdrawal requests found under your account. Visit the Wallet view to request a withdrawal!';
          } else {
            const latestPayout = payoutsLedger[payoutsLedger.length - 1];
            const amountStr = latestPayout.amount ? `₹${parseFloat(latestPayout.amount).toFixed(2)}` : 'N/A';
            const methodStr = latestPayout.method || 'payment';
            const statusStr = latestPayout.status ? latestPayout.status.toUpperCase() : 'PENDING';
            const dateStr = latestPayout.date || 'recently';
            
            let statusExplain = '';
            if (statusStr === 'PENDING') {
              statusExplain = '🕒 This is currently held for our standard review (usually takes 4-12 hours). Please refrain from duplicate inquiries.';
            } else if (statusStr === 'APPROVED') {
              statusExplain = '✅ This payout was processed and marked as PAID in our ledger database! Please verify your wallet or payment method.';
            } else if (statusStr === 'REJECTED') {
              statusExplain = '❌ This request was rejected and refunded back to your balance due to invalid details or audit criteria anomalies.';
            }
            
            reply = `📢 Last Withdrawal Status Query:\n\n• Amount: ${amountStr}\n• Method: ${methodStr}\n• Request Date: ${dateStr}\n• Status: [${statusStr}]\n\n${statusExplain}`;
          }
          break;
        }
        case 'Points Conversion Help': {
          reply = 'Our conversion policy is clear: 20 Points = ₹1. Once your balance hits the threshold of ₹100, you are allowed to request instant UPI, USDT TRC20, or BEP20 withdrawals directly via the Wallet section!';
          break;
        }
        case 'App Error': {
          reply = 'Encountered an application glitch? 1) Make sure you are not on a proxy or VPN. 2) Wipe your local browser storage & refresh. 3) Verify if device IP has been flagged by the anti-cloning checker. If none work, submit a manual support ticket.';
          break;
        }
      }
    } else {
      // General user queries: Fetch matching replies from our server-side secure Gemini route
      try {
        const userContext = {
          id: user.id,
          name: `${user.fname} ${user.lname}`,
          role: user.role,
          points: user.points,
          balance: user.balance,
          tasksCompleted: user.tasksCompleted,
          refs: user.refs,
          lastTaskStatus: (() => {
            if (taskLedgers.length === 0) return 'None';
            const latestRecord = taskLedgers[taskLedgers.length - 1];
            return `"${latestRecord.taskTitle || ''}" - Status: ${latestRecord.status || ''}`;
          })(),
          lastPayoutStatus: (() => {
            if (payoutsLedger.length === 0) return 'None';
            const latestPayout = payoutsLedger[payoutsLedger.length - 1];
            return `Amount: ₹${latestPayout.amount || 0} - Status: ${latestPayout.status || ''}`;
          })()
        };

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmedInput, userContext })
        });

        if (res.ok) {
          const result = await res.json();
          reply = result.text;
        } else {
          throw new Error('API server returned error code');
        }
      } catch (err) {
        console.warn('Support Chatbot server API failed, using standard response fallback:', err);
        reply = `Thank you for contacting EarnHub help. You queried: "${trimmedInput}". If you have missing points or delayed payouts, please raise a detailed support ticket in the Support Desks section. Our live admins will audit and respond!`;
      }
    }

    setMessages(prev => [
      ...prev,
      {
        sender: 'bot',
        text: reply || 'System under maintenance. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id: 'bot-' + Date.now()
      }
    ]);
    setIsTyping(false);
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const txt = inputText;
    setInputText('');
    handleAction(txt);
  };

  return (
    <div className="flex flex-col h-full bg-[#1b1b26] text-white">
      {/* Scrollable Message History Panel */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-none flex flex-col">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[80%] ${
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
            {m.time && (
              <span className="text-[9px] text-[#5a5a72] mt-0.5 px-1">{m.time}</span>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="self-start bg-[#111118]/50 border border-white/5 px-4 py-2.5 rounded-full text-[10px] text-[#9191a8] flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 bg-[#7c6cff] rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-[#7c6cff] rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-[#7c6cff] rounded-full animate-bounce [animation-delay:0.4s]"></span>
            <span>Typing reply...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Horizontal Row of Quick-Reply Action Chips */}
      <div className="px-3 py-2 bg-[#12121a]/80 border-t border-white/5 flex gap-1.5 overflow-x-auto scrollbar-none select-none shrink-0">
        {[
          { text: 'Check Last Task Status', icon: '🔍' },
          { text: 'Withdrawal Status', icon: '💸' },
          { text: 'Points Conversion Help', icon: '💰' },
          { text: 'App Error', icon: '🚨' }
        ].map((chip) => (
          <button
            key={chip.text}
            onClick={() => handleAction(chip.text)}
            disabled={isTyping}
            className="flex items-center gap-1 shrink-0 bg-[#7c6cff]/8 text-[#a594ff] hover:bg-[#7c6cff]/15 active:scale-95 border border-[#7c6cff]/20 font-semibold px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <span>{chip.icon}</span>
            <span>{chip.text}</span>
          </button>
        ))}
      </div>

      {/* Inline Text Input Area Layout */}
      <form
        onSubmit={onSubmitForm}
        className="p-3 bg-[#111118] border-t border-white/5 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isTyping}
          placeholder={isTyping ? "Waiting for response..." : "Ask me anything..."}
          className="flex-1 bg-[#1a1a24] border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#7c6cff]/50 placeholder-[#5a5a72] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isTyping || !inputText.trim()}
          className="bg-[#7c6cff] hover:bg-[#6b5bef] active:scale-95 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}

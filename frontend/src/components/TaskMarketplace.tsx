/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Task, TaskSubmission, Transaction } from '../types';
import confetti from 'canvas-confetti';

interface TaskMarketplaceProps {
  tasks: Task[];
  completedTasks: string[];
  onSubmitTask: (taskId: string, proofType: 'screenshot' | 'auto', file: File | null, link: string) => void;
  userId: string;
  submissions?: TaskSubmission[];
}

export default function TaskMarketplace({ tasks, completedTasks, onSubmitTask, userId, submissions = [] }: TaskMarketplaceProps) {
  const [filter, setFilter] = useState<'all' | 'social' | 'app' | 'survey' | 'high-paying'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Modal upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [proofLink, setProofLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    let matchesFilter = false;
    if (filter === 'all') matchesFilter = true;
    else if (filter === 'high-paying') matchesFilter = t.pts >= 150;
    else matchesFilter = t.type === filter;

    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartTask = (task: Task) => {
    setActiveTask(task);
    setUploadFile(null);
    setPreviewUrl(null);
    setProofLink('');
  };

  const handleSubmitProof = () => {
    if (!activeTask) return;
    if (activeTask.proof === 'screenshot' && !uploadFile) {
      alert('Please upload a screenshot proof first.');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c6cff', '#5aedcc', '#ffffff']
      });

      onSubmitTask(activeTask.id, activeTask.proof, uploadFile, proofLink);
      setIsUploading(false);
      setActiveTask(null);
    }, 1500);
  };

  return (
    <div className="fadeIn space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-1 bg-[#16161f] border border-white/7 p-1 rounded-xl w-full sm:w-auto overflow-x-auto whitespace-nowrap scrollbar-none">
          {(['all', 'social', 'app', 'survey', 'high-paying'] as const).map(f => (
            <button
              id={`task-filter-${f}`}
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? 'bg-[#1a1a24] text-[#f0f0f8] shadow-md'
                  : 'text-[#9191a8] hover:text-white'
              }`}
            >
              {f === 'all' ? 'All Tasks' : (f === 'high-paying' ? 'High-Paying' : f)}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <input
            id="task-search-input"
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2 pl-9 pr-4 text-xs text-[#f0f0f8] outline-none placeholder-[#5a5a72] focus:border-[#7c6cff] focus:ring-2 focus:ring-[#7c6cff]/10 transition-all"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5a5a72]" />
        </div>
      </div>

      {/* Local Micro-Task Board */}
      <div className="space-y-1.5 mb-4">
        <h3 className="font-display font-extrabold text-[#f0f0f8] text-lg">Local Micro-Task Board</h3>
        <p className="text-xs text-[#9191a8]">Dynamic Task Links Layout for available high-paying micro-tasks.</p>
      </div>

      {/* Grid */}
      <div className="space-y-3.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-[#5a5a72]">No tasks found. Try changing your filters.</div>
        ) : (
          filteredTasks.map(t => {
            const isCompleted = completedTasks.includes(t.id);
            return (
              <div 
                id={`task-card-${t.id}`}
                key={t.id} 
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-[#1a1a24] border border-white/7 rounded-2xl gap-4 transition-all duration-200 hover:border-white/12 ${isCompleted ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#16161f] flex items-center justify-center text-xl shrink-0">
                    {t.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[#f0f0f8] text-sm font-semibold">{t.title}</h4>
                      {t.status === 'hot' && (
                        <span className="badge bg-red-500/12 text-[#ff4f4f] border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                          🔥 Hot
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9191a8] leading-relaxed">{t.desc}</p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {t.type === 'social' && (
                        <span className="bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/20 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize">
                          Social
                        </span>
                      )}
                      {t.type === 'app' && (
                        <span className="bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/20 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize">
                          App
                        </span>
                      )}
                      {t.type === 'survey' && (
                        <span className="bg-[#f97316]/15 text-[#fb923c] border border-[#f97316]/20 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize">
                          Survey
                        </span>
                      )}
                      {t.pts >= 150 && (
                        <span className="bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/20 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize flex items-center gap-1">
                          💎 High-Paying
                        </span>
                      )}
                      <span className="bg-[#5aedcc]/12 text-[#5aedcc] border border-[#5aedcc]/20 rounded-full px-2.5 py-0.5 text-[10px] font-medium">
                        Proof: {t.proof === 'screenshot' ? 'Screenshot' : 'Auto'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0 border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[#a594ff] font-bold text-lg block font-display">+{t.pts}</span>
                    <span className="text-[10px] text-[#5a5a72] block">pts (₹{t.value.toFixed(1)})</span>
                  </div>

                  {isCompleted ? (
                    <span className="bg-[#3ecf8e]/12 text-[#3ecf8e] border border-[#3ecf8e]/20 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0">
                      Completed
                    </span>
                  ) : (
                    <button
                      id={`btn-start-${t.id}`}
                      onClick={() => handleStartTask(t)}
                      className="bg-[#7c6cff] hover:bg-[#6a5aef] text-white px-4 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer shrink-0 transition-all font-display"
                    >
                      Start Task
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* In-Flight Task Status Pipeline Monitor */}
      <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-display font-extrabold text-[#f0f0f8] text-lg">In-Flight Task Status Pipeline Monitor</h3>
          <p className="text-xs text-[#9191a8]">Track your submitted task verifications ("Pending Verification", "Approved", "Rejected").</p>
        </div>
        <div className="bg-[#1a1a24] border border-white/7 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#111118] text-[#9191a8] border-b border-white/5">
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Task Name</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Submitted</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Proof Limit</th>
                <th className="p-3.5 font-display font-semibold uppercase tracking-wider text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {submissions.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-[#9191a8]">No in-flight tasks in pipeline.</td></tr>
              ) : (
                submissions.map(sub => {
                  const tInfo = tasks.find(t => t.id === sub.taskId);
                  return (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-medium text-white">{tInfo?.title || 'Unknown Task'}</td>
                      <td className="p-3.5 text-[#9191a8] font-mono text-[10px]">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-[#9191a8] capitalize">{sub.proof.startsWith('Input') ? 'Text Input' : sub.proof.includes('Offerwall') ? 'S2S Network' : sub.proof.includes('Auto') ? 'Auto Sys' : 'Screenshot'}</td>
                      <td className="p-3.5">
                        <span className={`badge px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase ${
                          sub.status === 'pending' ? 'bg-orange-500/12 text-[#ffa94d] border-orange-500/20' :
                          sub.status === 'approved' ? 'bg-[#3ecf8e]/12 text-[#3ecf8e] border-[#3ecf8e]/20' :
                          'bg-red-500/12 text-[#ff4f4f] border-red-500/20'
                        }`}>
                          {sub.status === 'pending' ? 'Pending Verification' : sub.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Action Modal */}
      {activeTask && (
        <div id="task-action-modal-backdrop" className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1f2e] border border-white/12 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-white/7 pb-4">
              <h3 className="font-display font-bold text-base text-[#f0f0f8]">{activeTask.title}</h3>
              <button 
                id="close-task-modal"
                onClick={() => setActiveTask(null)}
                className="text-[#9191a8] hover:text-[#f0f0f8] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#16161f] p-4 rounded-2xl space-y-3">
              <div className="flex gap-3">
                <span className="text-3xl">{activeTask.icon}</span>
                <div>
                  <h4 className="text-xs font-semibold text-white">Instructions</h4>
                  <p className="text-[11px] text-[#9191a8] leading-relaxed mt-1">{activeTask.desc}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <span className="bg-[#7c6cff]/15 text-[#a594ff] border border-[#7c6cff]/20 rounded-full px-2.5 py-0.5 text-[10px] font-medium">
                  +{activeTask.pts} Points
                </span>
                <span className="bg-[#3ecf8e]/12 text-[#3ecf8e] border border-[#3ecf8e]/20 rounded-full px-2.5 py-0.5 text-[10px] font-medium">
                  ₹{activeTask.value.toFixed(1)} Cash value
                </span>
              </div>
            </div>

            {activeTask.proof === 'screenshot' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-[#9191a8] block font-medium">Cloudinary Client-Side Direct Screenshot Selector Node</label>
                  
                  <div 
                    id="screenshot-dropzone"
                    onClick={() => document.getElementById('screenshot-file-input')?.click()}
                    className="border-2 border-dashed border-white/12 hover:border-[#7c6cff] hover:bg-[#7c6cff]/5 rounded-2xl p-6 text-center cursor-pointer transition-all"
                  >
                    <input 
                      id="screenshot-file-input"
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    <div className="text-3xl mb-2">📸</div>
                    <div className="text-xs font-semibold text-white">Click to select screenshot</div>
                    <div className="text-[10px] text-[#5a5a72] mt-1">PNG, JPG up to 5MB</div>
                  </div>

                  {previewUrl && (
                    <div className="mt-3 text-center">
                      <p className="text-[10px] text-[#3ecf8e] mb-1">✓ Preview ready</p>
                      <img 
                        src={previewUrl} 
                        alt="Screenshot proof" 
                        className="max-h-40 rounded-xl mx-auto border border-white/7 shadow-md"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#9191a8] block font-medium">Task Profile Link / Handle (optional)</label>
                  <input
                    id="proof-link-input"
                    type="text"
                    placeholder="e.g. https://youtube.com/my-channel or @username"
                    value={proofLink}
                    onChange={(e) => setProofLink(e.target.value)}
                    className="w-full bg-[#16161f] border border-white/12 rounded-xl py-2.5 px-3 text-xs text-[#f0f0f8] outline-none placeholder-[#5a5a72] focus:border-[#7c6cff]"
                  />
                </div>

                <button
                  id="submit-screenshot-proof-btn"
                  onClick={handleSubmitProof}
                  disabled={isUploading}
                  className="w-full bg-[#7c6cff] hover:bg-[#6a5aef] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-semibold text-center cursor-pointer transition-all font-display"
                >
                  {isUploading ? 'Uploading proof and verifying...' : 'Submit Proof Verification →'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center py-4">
                <div className="text-4xl">⚡</div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-white">Instant Postback Verification</h4>
                  <p className="text-xs text-[#9191a8]">Clicking below will complete the task immediately and credit your account.</p>
                </div>
                <button
                  id="submit-auto-proof-btn"
                  onClick={handleSubmitProof}
                  disabled={isUploading}
                  className="w-full bg-[#7c6cff] hover:bg-[#6a5aef] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-semibold text-center cursor-pointer transition-all font-display"
                >
                  {isUploading ? 'Verifying with sponsor...' : 'Complete & Earn Now →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

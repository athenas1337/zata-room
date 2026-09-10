'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileCode,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface HumanApprovalModalProps {
  isOpen: boolean;
  filePath: string;
  proposedContent: string;
  agentName: string;
  onApprove: () => void;
  onReject: (feedback: string) => void;
  onClose: () => void;
}

export default function HumanApprovalModal({
  isOpen,
  filePath,
  proposedContent,
  agentName,
  onApprove,
  onReject,
  onClose,
}: HumanApprovalModalProps) {
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handleApprove = () => {
    soundManager.playCheckpoint();
    onApprove();
    onClose();
  };

  const handleReject = () => {
    soundManager.playStop();
    onReject(feedback || 'Human director requested revision.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-[#0b040e] border border-amber-500/70 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-slate-200 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Human-in-the-Loop Intercept Gate (Cline Paradigm)
                </h2>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold uppercase">
                  Pending Signoff
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Agent <strong className="text-amber-300">{agentName}</strong> requests permission to write file: <code className="text-rose-400">{filePath}</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Proposed Code Preview */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FileCode className="h-3.5 w-3.5 text-rose-400" />
            <span>Proposed File Code Diff:</span>
          </span>
          <pre className="p-3 bg-[#08020b] border border-rose-950 rounded-xl overflow-x-auto text-[11px] text-emerald-300 h-44 font-mono leading-relaxed">
            {proposedContent}
          </pre>
        </div>

        {/* Feedback Input on Reject */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase">
            Optional Director Feedback (if rejecting):
          </label>
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Ensure we add try-catch block and proper error typing..."
            className="w-full px-3 py-2 rounded-xl bg-[#110517] border border-rose-950 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-950/60">
          <button
            onClick={handleReject}
            className="px-4 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-700 text-red-200 font-bold text-xs flex items-center gap-1.5 transition"
          >
            <XCircle className="h-4 w-4" />
            <span>Reject &amp; Request Revision</span>
          </button>

          <button
            onClick={handleApprove}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/50"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Approve &amp; Apply to VFS</span>
          </button>
        </div>
      </div>
    </div>
  );
}

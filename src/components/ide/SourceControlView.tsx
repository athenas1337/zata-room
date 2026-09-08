'use client';

import React, { useState } from 'react';
import { VirtualFileDTO } from '@/types';
import { GitBranch, GitCommit, Check, RefreshCw, FileCode, Plus, CheckCircle2, Sparkles } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface SourceControlViewProps {
  roomId: string;
  files: VirtualFileDTO[];
  onCommitSuccess?: () => void;
  isHost?: boolean;
}

export default function SourceControlView({
  roomId,
  files = [],
  onCommitSuccess,
  isHost = false,
}: SourceControlViewProps) {
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [committedSuccess, setCommittedSuccess] = useState(false);

  // Generate automated AI commit message suggestion
  const handleAutoSuggestMessage = () => {
    soundManager.playClick();
    const actions = ['feat', 'refactor', 'fix', 'chore'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const targetFile = files[0]?.name || 'workspace';
    setCommitMessage(`${randomAction}: enhance ${targetFile} via Makima agentic orchestration`);
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim() || isCommitting) return;

    setIsCommitting(true);
    soundManager.playCheckpoint();

    try {
      // Execute git commit command in virtual terminal
      await fetch(`/api/rooms/${roomId}/terminal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: `git commit -m "${commitMessage.trim().replace(/"/g, '\\"')}"`,
          executedBy: 'Human Director (Git VCS)',
        }),
      });

      setCommittedSuccess(true);
      setCommitMessage('');
      setTimeout(() => setCommittedSuccess(false), 3000);
      if (onCommitSuccess) onCommitSuccess();
    } catch (err) {
      console.error('Commit failed:', err);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0713] border border-rose-950/50 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* Title bar */}
      <div className="px-4 py-3 bg-[#130917] border-b border-rose-950/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-rose-400" />
          <span className="font-bold text-white">Source Control: Git</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
            branch: main
          </span>
        </div>
      </div>

      {/* Commit Input Box */}
      <form onSubmit={handleCommit} className="p-3 border-b border-rose-950/40 space-y-2.5 bg-[#09040c]">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <GitCommit className="h-3.5 w-3.5 text-amber-400" />
            <span>Commit Message</span>
          </label>
          <button
            type="button"
            onClick={handleAutoSuggestMessage}
            className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            title="Generate AI Commit Message Suggestion"
          >
            <Sparkles className="h-3 w-3" />
            <span>AI Suggest</span>
          </button>
        </div>

        <input
          type="text"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="e.g. feat: implement auth router and test suite"
          className="w-full px-3 py-2 rounded-lg bg-[#140819] border border-rose-950 text-white text-xs focus:outline-none focus:border-rose-500 placeholder-slate-600"
        />

        <button
          type="submit"
          disabled={!commitMessage.trim() || isCommitting}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5" />
          <span>{isCommitting ? 'Committing...' : 'Commit Changes to main'}</span>
        </button>

        {committedSuccess && (
          <div className="p-2 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Commit successfully recorded in Git VCS tree!</span>
          </div>
        )}
      </form>

      {/* Changes list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2">
          Working Tree Changes ({files.length})
        </div>

        {files.map((f) => (
          <div
            key={f.path}
            className="px-2.5 py-1.5 rounded-lg bg-[#130819]/60 hover:bg-[#180a1f] border border-rose-950/30 flex items-center justify-between text-xs text-slate-300"
          >
            <div className="flex items-center gap-2 truncate">
              <FileCode className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{f.path}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">M</span>
          </div>
        ))}
      </div>
    </div>
  );
}

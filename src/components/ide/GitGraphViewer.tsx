'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Clock,
  UserCheck,
  CheckCircle2,
  Tag,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface CommitNode {
  hash: string;
  message: string;
  author: string;
  branch: string;
  time: string;
  tag?: string;
  verified?: boolean;
}

interface GitGraphViewerProps {
  roomId: string;
  currentTurn?: number;
  onRollback?: (hash: string) => void;
}

const MOCK_COMMITS: CommitNode[] = [
  {
    hash: '7a05504',
    message: 'feat: implement Makima Cloud IDE & multi-tab terminal workbench',
    author: 'Atha (Lead Architect)',
    branch: 'main',
    time: 'Just now',
    tag: 'v1.0.0-rc1',
    verified: true,
  },
  {
    hash: '9e41d20',
    message: 'feat: add virtual file system and terminal execution engine',
    author: 'AI Agent #1 (Architect)',
    branch: 'main',
    time: '12m ago',
    verified: true,
  },
  {
    hash: '5c12e8b',
    message: 'fix(safety): enforce anti-infinite-loop semantic watchdog gate',
    author: 'AI Agent #2 (Code Reviewer)',
    branch: 'feature/safety-guard',
    time: '28m ago',
    verified: true,
  },
  {
    hash: '3f80a42',
    message: 'chore: seed project scaffolding and AES-256 room security',
    author: 'Atha (Lead Architect)',
    branch: 'main',
    time: '45m ago',
    tag: 'v0.9.0',
    verified: true,
  },
  {
    hash: '1a90c33',
    message: 'Initial commit: ZATA Agentic Room core architecture',
    author: 'ZATA System',
    branch: 'main',
    time: '1h ago',
    verified: true,
  },
];

export default function GitGraphViewer({
  roomId,
  currentTurn = 1,
  onRollback,
}: GitGraphViewerProps) {
  const [selectedCommit, setSelectedCommit] = useState<CommitNode>(MOCK_COMMITS[0]);
  const [activeBranch, setActiveBranch] = useState('main');

  const branches = ['main', 'feature/safety-guard', 'feature/agent-swarm'];

  const handleSelectCommit = (c: CommitNode) => {
    soundManager.playClick();
    setSelectedCommit(c);
  };

  const handleRollback = () => {
    if (confirm(`Rollback workspace state to commit ${selectedCommit.hash}?`)) {
      soundManager.playCheckpoint();
      if (onRollback) onRollback(selectedCommit.hash);
      alert(`Workspace rolled back to commit ${selectedCommit.hash}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08040a] font-mono text-xs select-none">
      {/* Header with Branch Selector */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0e0513] border-b border-rose-950/60">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-rose-400" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Visual Git Tree &amp; Version History (F31)
          </span>
        </div>

        {/* Branch Pills */}
        <div className="flex items-center gap-1.5">
          {branches.map((b) => (
            <button
              key={b}
              onClick={() => {
                soundManager.playClick();
                setActiveBranch(b);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                activeBranch === b
                  ? 'bg-rose-950 border border-rose-700 text-rose-200'
                  : 'bg-slate-900/60 text-slate-500 hover:text-slate-300'
              }`}
            >
              <GitBranch className="h-3 w-3" />
              <span>{b}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Commit Graph (Left) & Commit Details (Right) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Graph List (7 cols) */}
        <div className="md:col-span-7 p-4 overflow-y-auto space-y-3 border-r border-rose-950/50">
          <div className="relative pl-6 space-y-4">
            {/* Connecting Vertical Line */}
            <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-rose-500 via-purple-600 to-slate-800" />

            {MOCK_COMMITS.map((commit, idx) => {
              const isSelected = selectedCommit.hash === commit.hash;
              const isMain = commit.branch === 'main';

              return (
                <div
                  key={commit.hash}
                  onClick={() => handleSelectCommit(commit)}
                  className={`relative cursor-pointer p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#15071d] border-rose-600 shadow-md shadow-rose-950/50'
                      : 'bg-[#100615]/70 border-rose-950/40 hover:border-rose-800/60'
                  }`}
                >
                  {/* Graph Node Dot */}
                  <span
                    className={`absolute -left-[18px] top-5 h-3.5 w-3.5 rounded-full border-2 border-[#08040a] transition ${
                      isSelected
                        ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                        : isMain
                        ? 'bg-purple-500'
                        : 'bg-amber-500'
                    }`}
                  />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-rose-400 font-bold">{commit.hash}</span>
                        {commit.tag && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-700 text-amber-300 text-[9px] font-bold flex items-center gap-0.5">
                            <Tag className="h-2.5 w-2.5" />
                            <span>{commit.tag}</span>
                          </span>
                        )}
                        {commit.verified && (
                          <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5" title="Cryptographically Verified Commit (F38)">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{commit.time}</span>
                      </span>
                    </div>

                    <p className={`text-xs ${isSelected ? 'text-white font-semibold' : 'text-slate-300'}`}>
                      {commit.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-slate-400" />
                        <span>{commit.author}</span>
                      </span>
                      <span className="font-mono text-slate-400">{commit.branch}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Commit Details & Time Machine (5 cols) */}
        <div className="md:col-span-5 p-4 bg-[#0a040e] flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="pb-2 border-b border-rose-950/60">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Commit Snapshot Inspector</span>
              <h3 className="text-sm font-bold text-white mt-1 flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-rose-400" />
                <span>{selectedCommit.hash}</span>
              </h3>
            </div>

            <div className="p-3 bg-[#110617] border border-rose-950 rounded-xl space-y-2">
              <div className="text-xs font-semibold text-rose-200">{selectedCommit.message}</div>
              <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                <div>Author: <span className="text-slate-200">{selectedCommit.author}</span></div>
                <div>Branch: <span className="text-rose-400">{selectedCommit.branch}</span></div>
                <div>Timestamp: <span className="text-slate-200">{selectedCommit.time}</span></div>
                <div>Signing Status: <span className="text-emerald-400 font-bold">Ed25519 Verified</span></div>
              </div>
            </div>

            {/* Changed Files Summary in this commit */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Changed Assets:</span>
              <div className="p-2 rounded-lg bg-[#0e0513] border border-rose-950/50 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-emerald-400">
                  <span>+ src/components/ide/GitGraphViewer.tsx</span>
                  <span>142 lines</span>
                </div>
                <div className="flex items-center justify-between text-amber-400">
                  <span>~ src/components/room/SharedWorkspace.tsx</span>
                  <span>48 lines</span>
                </div>
              </div>
            </div>
          </div>

          {/* F36: Time Machine Rollback Button */}
          <div className="pt-3 border-t border-rose-950/60 space-y-2">
            <button
              onClick={handleRollback}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-700 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
              <span>Time Machine Rollback to {selectedCommit.hash} (F36)</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              Reverts virtual workspace state safely without altering remote git tags.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

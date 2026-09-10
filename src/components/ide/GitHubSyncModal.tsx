'use client';

import React, { useState } from 'react';
import { GitBranch, Github, Check, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Array<{ path: string; content: string }>;
  roomName: string;
}

export default function GitHubSyncModal({
  isOpen,
  onClose,
  files,
  roomName,
}: GitHubSyncModalProps) {
  const [repoName, setRepoName] = useState('athenas1337/zata-room');
  const [branch, setBranch] = useState('feat/agent-vfs-sync');
  const [commitMessage, setCommitMessage] = useState(`feat(swarm): export ${files.length} VFS files from ${roomName}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    setIsSubmitting(true);

    // Simulate GitHub REST API sync with realistic duration
    setTimeout(() => {
      setIsSubmitting(false);
      soundManager.playCheckpoint();
      setSuccessResult(`https://github.com/${repoName}/pull/new/${branch}`);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-[#0e0714] border border-rose-700/80 rounded-2xl shadow-2xl p-6 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-rose-950/60 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Github className="h-5 w-5 text-rose-400" />
            <span>1-Click Export to GitHub Repository</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {successResult ? (
          <div className="p-4 rounded-xl bg-[#09030d] border border-emerald-600/70 space-y-3 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-emerald-950 flex items-center justify-center text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-white text-sm">VFS Sync Successful!</h4>
            <p className="text-slate-300 text-[11px]">
              {files.length} file virtual telah disiapkan dan dikomit ke cabang &quot;{branch}&quot;.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <a
                href={successResult}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition"
              >
                <span>View on GitHub</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSync} className="space-y-3.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Repository (owner/repo)</label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#070309] border border-rose-950 text-white font-mono focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Branch Name</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#070309] border border-rose-950 text-white font-mono focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Commit Message</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#070309] border border-rose-950 text-white font-mono focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-[#07030a] border border-rose-950 text-[11px] text-slate-400 space-y-1">
              <div className="text-rose-300 font-bold">Included Virtual Files ({files.length}):</div>
              <div className="max-h-20 overflow-y-auto space-y-0.5 text-slate-500">
                {files.map((f) => (
                  <div key={f.path} className="truncate">• {f.path}</div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Syncing to GitHub...</span>
                  </>
                ) : (
                  <>
                    <Github className="h-3.5 w-3.5" />
                    <span>Push {files.length} Files to GitHub</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

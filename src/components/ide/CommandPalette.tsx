'use client';

import React, { useState, useEffect } from 'react';
import { Search, FileCode, Terminal, Zap, Play, Square, Volume2, ShieldCheck, X, ArrowRight } from 'lucide-react';
import { VirtualFileDTO } from '@/types';
import { soundManager } from '@/lib/sound';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files?: VirtualFileDTO[];
  onSelectFile?: (path: string) => void;
  onRunTerminal?: (cmd: string) => void;
  onInstantStop?: () => void;
  onResume?: () => void;
  onOpenGodMode?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  files = [],
  onSelectFile,
  onRunTerminal,
  onInstantStop,
  onResume,
  onOpenGodMode,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'p')) {
        e.preventDefault();
        soundManager.playClick();
        if (isOpen) onClose();
        else {
          // open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(query.toLowerCase())
  );

  const defaultActions = [
    {
      id: 'term-test',
      title: 'Run Virtual Test Suite (npm test)',
      category: 'Terminal',
      icon: Terminal,
      action: () => onRunTerminal && onRunTerminal('npm test'),
    },
    {
      id: 'term-git',
      title: 'Check Git Status (git status)',
      category: 'Terminal',
      icon: Terminal,
      action: () => onRunTerminal && onRunTerminal('git status'),
    },
    {
      id: 'stop',
      title: 'Instant Stop Agent Loop (<500ms)',
      category: 'Safety',
      icon: Square,
      action: () => onInstantStop && onInstantStop(),
    },
    {
      id: 'resume',
      title: 'Resume Autonomous Collaboration',
      category: 'Safety',
      icon: Play,
      action: () => onResume && onResume(),
    },
    {
      id: 'beat',
      title: 'Play Phonk 808 Beat Drop',
      category: 'Audio',
      icon: Volume2,
      action: () => soundManager.playJedagJedugBeat(),
    },
    {
      id: 'godmode',
      title: 'Open Developer GodMode Console (Ctrl+Shift+A)',
      category: 'Developer',
      icon: Zap,
      action: () => onOpenGodMode && onOpenGodMode(),
    },
  ];

  const filteredActions = defaultActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="max-w-xl w-full bg-[#0e0714] border-2 border-rose-600/70 rounded-2xl shadow-2xl shadow-rose-950/60 overflow-hidden flex flex-col font-mono text-xs">
        {/* Search input line */}
        <div className="p-3 bg-[#14091a] border-b border-rose-950/60 flex items-center gap-2.5">
          <Search className="h-4 w-4 text-rose-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search workspace files..."
            className="flex-1 bg-transparent text-white text-xs focus:outline-none placeholder-slate-500 font-mono"
            autoFocus
          />
          <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            ESC to exit
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {/* Files section */}
          {filteredFiles.length > 0 && (
            <div className="space-y-0.5 mb-2">
              <div className="text-[10px] uppercase font-bold text-rose-400/80 px-2 py-1">
                Workspace Files ({filteredFiles.length})
              </div>
              {filteredFiles.map((file) => (
                <button
                  key={file.path}
                  onClick={() => {
                    if (onSelectFile) onSelectFile(file.path);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-900/40 hover:bg-rose-950/60 hover:text-white border border-transparent hover:border-rose-800/60 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-rose-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}

          {/* Actions section */}
          {filteredActions.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-amber-400/80 px-2 py-1">
                Commands &amp; Actions
              </div>
              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-900/40 hover:bg-rose-950/60 hover:text-white border border-transparent hover:border-rose-800/60 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{action.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{action.category}</span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredFiles.length === 0 && filteredActions.length === 0 && (
            <div className="p-6 text-center text-slate-500">No matching files or commands found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

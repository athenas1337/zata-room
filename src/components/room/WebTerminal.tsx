'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TerminalLogDTO } from '@/types';
import {
  Terminal as TerminalIcon,
  Play,
  Trash2,
  CheckCircle,
  AlertCircle,
  CornerDownLeft,
  Sparkles,
  GitBranch,
  Layers,
  Cpu,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface WebTerminalProps {
  roomId: string;
  logs: TerminalLogDTO[];
  onCommandExecuted?: () => void;
  isHost?: boolean;
}

const QUICK_COMMANDS = ['zata help', 'ls -la', 'npm test', 'git status', 'pwd', 'npm run build', 'clear'];

export default function WebTerminal({
  roomId,
  logs = [],
  onCommandExecuted,
  isHost = false,
}: WebTerminalProps) {
  const [activeTab, setActiveTab] = useState<'bash' | 'agent-runner' | 'git' | 'test-runner'>('bash');
  const [inputCommand, setInputCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [localLogs, setLocalLogs] = useState<TerminalLogDTO[]>(logs);
  const [isMaximized, setIsMaximized] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalLogs(logs);
  }, [logs]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localLogs, activeTab]);

  const handleRunCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || inputCommand).trim();
    if (!cmd || isExecuting) return;

    if (cmd === 'clear') {
      setLocalLogs([]);
      setInputCommand('');
      return;
    }

    setIsExecuting(true);
    soundManager.playClick();

    setHistory((prev) => [cmd, ...prev]);
    setHistoryIdx(-1);
    setInputCommand('');

    try {
      const res = await fetch(`/api/rooms/${roomId}/terminal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmd,
          executedBy: 'Human Director (CLI)',
        }),
      });
      const data = await res.json();
      if (data.success && data.log) {
        setLocalLogs((prev) => [...prev, data.log]);
        if (onCommandExecuted) onCommandExecuted();
      }
    } catch (err) {
      console.error('Terminal execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRunCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIdx < history.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInputCommand(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputCommand(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputCommand('');
      }
    }
  };

  // Filter logs by active tab
  const filteredLogs = localLogs.filter((log) => {
    if (activeTab === 'git') return log.command.startsWith('git');
    if (activeTab === 'test-runner') return log.command.includes('test') || log.command.includes('jest');
    if (activeTab === 'agent-runner') return log.executedBy?.includes('Agent') || log.executedBy?.includes('Beta') || log.executedBy?.includes('Alpha');
    return true;
  });

  return (
    <div
      className={`flex flex-col bg-[#08040a] rounded-xl border border-rose-950/60 overflow-hidden shadow-2xl font-mono transition-all ${
        isMaximized ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : 'h-full'
      }`}
    >
      {/* Terminal Titlebar & Tab Bar */}
      <div className="px-3 py-2 bg-[#0e0714] border-b border-rose-950/60 flex items-center justify-between gap-3 text-xs select-none">
        {/* Terminal Tabs (VS Code style) */}
        <div className="flex items-center gap-1">
          {[
            { id: 'bash', label: '1: bash', icon: TerminalIcon },
            { id: 'agent-runner', label: '2: agent-swarm', icon: Cpu },
            { id: 'git', label: '3: git-vcs', icon: GitBranch },
            { id: 'test-runner', label: '4: tests', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 text-[11px] font-mono ${
                  isActive
                    ? 'bg-[#18091f] text-rose-300 border border-rose-800/60 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#120817]'
                }`}
              >
                <Icon className="h-3 w-3 text-rose-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right window actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={isMaximized ? 'Restore Down' : 'Maximize Panel'}
          >
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setLocalLogs([])}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Clear Terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Command Chips */}
      <div className="px-3 py-1 bg-[#09040c] border-b border-rose-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-slate-500 text-[10px] uppercase font-bold shrink-0">Chips:</span>
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleRunCommand(cmd)}
            disabled={isExecuting}
            className="px-2 py-0.5 rounded bg-[#130819] hover:bg-[#1c0c24] text-rose-300 border border-rose-950 text-[10px] font-mono transition shrink-0 hover:border-rose-700/50"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs bg-[#070309]">
        <div className="text-slate-500 text-[11px] select-none border-b border-rose-950/40 pb-2 flex items-center justify-between">
          <span>ZATA Antigravity Virtual Terminal &bull; Makima Sandboxed CLI</span>
          <span className="text-rose-400 font-bold">Node v22 &bull; bash 5.2</span>
        </div>

        {filteredLogs.map((log) => (
          <div key={log.id} className="space-y-1 animate-in fade-in duration-100">
            {/* Command Line Prompt */}
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-rose-500 font-bold">zata@makima:~$</span>
                <span className="text-white font-bold">{log.command}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 shrink-0">
                <span>{log.executedBy}</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold ${
                    log.exitCode === 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                  }`}
                >
                  exit {log.exitCode}
                </span>
              </div>
            </div>

            {/* Output */}
            {log.output && (
              <pre
                className={`p-2 rounded-lg text-[11px] whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto ${
                  log.exitCode === 0
                    ? 'bg-[#0e0714] text-rose-100/90 border border-rose-950/40'
                    : 'bg-red-950/30 text-red-300 border border-red-900/50'
                }`}
              >
                {log.output}
              </pre>
            )}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Interactive Command Input Line */}
      <div className="p-2.5 bg-[#0e0714] border-t border-rose-950/60 flex items-center gap-2">
        <span className="text-rose-500 text-xs font-bold shrink-0">zata@makima:~$</span>
        <input
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Run commands (e.g. zata help, npm test, git status, ls)..."
          disabled={isExecuting}
          className="flex-1 bg-transparent text-white text-xs font-mono focus:outline-none placeholder-slate-600"
          autoFocus
        />
        <button
          onClick={() => handleRunCommand()}
          disabled={!inputCommand.trim() || isExecuting}
          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1 shadow-sm shadow-rose-600/30"
        >
          <CornerDownLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Enter</span>
        </button>
      </div>
    </div>
  );
}

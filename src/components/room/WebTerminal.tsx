'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TerminalLogDTO } from '@/types';
import { Terminal as TerminalIcon, Play, Trash2, CheckCircle, AlertCircle, CornerDownLeft, Sparkles } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface WebTerminalProps {
  roomId: string;
  logs: TerminalLogDTO[];
  onCommandExecuted?: () => void;
  isHost?: boolean;
}

const QUICK_COMMANDS = ['ls -la', 'npm test', 'git status', 'pwd', 'npm run build', 'clear'];

export default function WebTerminal({
  roomId,
  logs = [],
  onCommandExecuted,
  isHost = false,
}: WebTerminalProps) {
  const [inputCommand, setInputCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [localLogs, setLocalLogs] = useState<TerminalLogDTO[]>(logs);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalLogs(logs);
  }, [logs]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localLogs]);

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

    // Add to local history
    setHistory((prev) => [cmd, ...prev]);
    setHistoryIdx(-1);
    setInputCommand('');

    try {
      const res = await fetch(`/api/rooms/${roomId}/terminal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmd,
          executedBy: 'Human Director',
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

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl font-mono">
      {/* Terminal Titlebar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <TerminalIcon className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">bash &bull; zata@sandbox:~/workspace</span>
        </div>

        <button
          onClick={() => setLocalLogs([])}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition"
          title="Clear Screen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quick Command Chips */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-slate-500 text-[10px] uppercase font-bold shrink-0">Quick:</span>
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleRunCommand(cmd)}
            disabled={isExecuting}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-[11px] font-mono transition shrink-0 hover:border-emerald-500/40"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        <div className="text-slate-500 text-[11px] select-none border-b border-slate-800/60 pb-2">
          Antigravity Virtual Terminal v2.4 (Simulated Sandbox Safe Environment)
          <br />
          Type commands or run tests. Live outputs synchronized to all room participants.
        </div>

        {localLogs.map((log) => (
          <div key={log.id} className="space-y-1">
            {/* Command Header */}
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">zata@sandbox:~$</span>
                <span className="text-white font-bold">{log.command}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>by {log.executedBy}</span>
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
                className={`p-2.5 rounded-lg text-[11px] whitespace-pre-wrap font-mono leading-relaxed ${
                  log.exitCode === 0
                    ? 'bg-slate-900/90 text-slate-300 border border-slate-800/60'
                    : 'bg-red-950/40 text-red-300 border border-red-900/50'
                }`}
              >
                {log.output}
              </pre>
            )}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Terminal Input Line */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        <span className="text-emerald-400 text-xs font-bold shrink-0">zata@sandbox:~$</span>
        <input
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command (e.g. ls, npm test, git status)..."
          disabled={isExecuting}
          className="flex-1 bg-transparent text-white text-xs font-mono focus:outline-none placeholder-slate-600"
          autoFocus
        />
        <button
          onClick={() => handleRunCommand()}
          disabled={!inputCommand.trim() || isExecuting}
          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1"
        >
          <CornerDownLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Enter</span>
        </button>
      </div>
    </div>
  );
}

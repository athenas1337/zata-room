'use client';

import React from 'react';
import { Activity, Zap, DollarSign, Clock, Cpu, BarChart3, Database } from 'lucide-react';

interface ObservabilityDashboardProps {
  totalTokens?: number;
  estimatedCost?: number;
  turnCount?: number;
  maxTurns?: number;
}

export default function ObservabilityDashboard({
  totalTokens = 1840,
  estimatedCost = 0.0042,
  turnCount = 4,
  maxTurns = 50,
}: ObservabilityDashboardProps) {
  // Simulated APM telemetry spans
  const telemetrySpans = [
    {
      id: 'span-1',
      name: 'Agent Prompt Generation & Context Resolution',
      agent: 'Architect Alpha',
      durationMs: 420,
      tokens: 610,
      costUsd: 0.0012,
      percentage: 35,
      type: 'LLM Inference',
    },
    {
      id: 'span-2',
      name: 'VFS Multi-File I/O & Git Commit Attribution',
      agent: 'Coder Beta',
      durationMs: 180,
      tokens: 440,
      costUsd: 0.0009,
      percentage: 25,
      type: 'VFS Action',
    },
    {
      id: 'span-3',
      name: 'Anti-Hallucination & Repetition Guard Probe',
      agent: 'Safety Engine',
      durationMs: 45,
      tokens: 120,
      costUsd: 0.0003,
      percentage: 10,
      type: 'Guardrail',
    },
    {
      id: 'span-4',
      name: 'Self-Healing Automated Test Suite (npm test)',
      agent: 'Test Runner',
      durationMs: 360,
      tokens: 670,
      costUsd: 0.0018,
      percentage: 30,
      type: 'Execution',
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0b0510] border border-rose-950/70 rounded-2xl overflow-hidden font-mono text-xs shadow-2xl">
      {/* Header Bar */}
      <div className="px-5 py-3 bg-[#120718] border-b border-rose-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-rose-400" />
          <span className="font-bold text-white text-xs">Observability &amp; Token Flame Graph</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
            Live APM
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Telemetry Stream Active</span>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-rose-950/50">
        <div className="p-3 rounded-xl bg-[#07030a] border border-rose-950 space-y-1">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Cpu className="h-3 w-3 text-rose-400" /> Total Tokens
          </span>
          <div className="text-base font-bold text-white">{totalTokens.toLocaleString()}</div>
          <span className="text-[9px] text-slate-400">Prompt: 68% &bull; Comp: 32%</span>
        </div>

        <div className="p-3 rounded-xl bg-[#07030a] border border-rose-950 space-y-1">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-emerald-400" /> Real-Time Cost
          </span>
          <div className="text-base font-bold text-emerald-400">${estimatedCost.toFixed(4)}</div>
          <span className="text-[9px] text-slate-400">Hard Cap: $2.00 USD</span>
        </div>

        <div className="p-3 rounded-xl bg-[#07030a] border border-rose-950 space-y-1">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-400" /> Turn Cycles
          </span>
          <div className="text-base font-bold text-amber-300">
            {turnCount} / {maxTurns}
          </div>
          <span className="text-[9px] text-slate-400">Delay: 5s / turn</span>
        </div>

        <div className="p-3 rounded-xl bg-[#07030a] border border-rose-950 space-y-1">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Zap className="h-3 w-3 text-cyan-400" /> Median Latency
          </span>
          <div className="text-base font-bold text-cyan-300">251 ms</div>
          <span className="text-[9px] text-slate-400">P99: 420 ms</span>
        </div>
      </div>

      {/* Flame Graph / Waterfall Span List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-rose-950/40 pb-2">
          <span>Execution Span &amp; Tool Call Waterfall</span>
          <span>Relative Latency (%)</span>
        </div>

        <div className="space-y-3 pt-1">
          {telemetrySpans.map((span) => (
            <div key={span.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-[9px] font-bold">
                    {span.type}
                  </span>
                  <span className="text-white font-medium">{span.name}</span>
                  <span className="text-slate-500 text-[10px]">({span.agent})</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="text-amber-400">{span.tokens} tokens</span>
                  <span className="font-bold text-rose-300">{span.durationMs}ms</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-[#07030a] rounded-full overflow-hidden border border-rose-950/50">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${span.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

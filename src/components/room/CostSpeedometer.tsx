'use client';

import React from 'react';
import { Gauge, Zap, DollarSign, ShieldCheck, Flame } from 'lucide-react';

interface CostSpeedometerProps {
  totalTokens: number;
  estimatedCost: number;
  currentTurn: number;
  maxTurns: number;
}

export default function CostSpeedometer({
  totalTokens,
  estimatedCost,
  currentTurn,
  maxTurns,
}: CostSpeedometerProps) {
  // Approximate burn rate
  const tokensPerTurn = currentTurn > 0 ? Math.round(totalTokens / currentTurn) : 0;
  const progressRatio = Math.min(1, currentTurn / Math.max(1, maxTurns));

  const burnLevel =
    tokensPerTurn > 4000 ? 'critical' : tokensPerTurn > 2000 ? 'elevated' : 'optimal';

  return (
    <div className="p-2.5 rounded-xl bg-[#0c0512] border border-rose-950/70 font-mono text-xs flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-rose-950/50 border border-rose-900/40 text-rose-400 shrink-0">
          <Gauge className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-[11px] uppercase tracking-wider">
              Token Burn-Rate Meter (F51)
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                burnLevel === 'optimal'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : burnLevel === 'elevated'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-red-950 text-red-300 border border-red-800'
              }`}
            >
              {burnLevel}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
            <span>~{tokensPerTurn.toLocaleString()} tok/turn</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-bold">${estimatedCost.toFixed(4)} USD</span>
            <span>&bull;</span>
            <span className="text-slate-500">Turn {currentTurn}/{maxTurns}</span>
          </div>
        </div>
      </div>

      {/* Secret Sanitizer Badge (F58) */}
      <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-[10px]">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        <span>Credential Sanitizer Active (F58)</span>
      </div>
    </div>
  );
}

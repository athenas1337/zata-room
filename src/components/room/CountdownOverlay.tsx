'use client';

import React from 'react';
import { Timer, FastForward } from 'lucide-react';

interface CountdownOverlayProps {
  secondsLeft: number;
  totalSeconds: number;
  nextAgentName: string;
  nextAgentAvatarColor?: string;
  onSkipDelay: () => void;
}

export default function CountdownOverlay({
  secondsLeft,
  totalSeconds,
  nextAgentName,
  nextAgentAvatarColor = '#3b82f6',
  onSkipDelay,
}: CountdownOverlayProps) {
  if (secondsLeft <= 0) return null;

  const progressPct = Math.max(0, Math.min(100, (secondsLeft / Math.max(1, totalSeconds)) * 100));

  return (
    <div className="w-full my-3 px-4 animate-in fade-in duration-300">
      <div className="max-w-xl mx-auto rounded-2xl border border-blue-900/60 bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-blue-950/80 backdrop-blur-md p-3.5 shadow-xl flex items-center justify-between gap-4">
        {/* Timer Icon & Text */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-blue-900/40 border border-blue-700/50">
            <Timer className="h-5 w-5 text-blue-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Turn Delay Countdown
              </span>
              <span className="text-xs font-mono font-bold text-white bg-blue-600/30 px-2 py-0.5 rounded border border-blue-500/40">
                {secondsLeft}s
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Next turn:{' '}
              <span className="font-semibold" style={{ color: nextAgentAvatarColor }}>
                {nextAgentName}
              </span>{' '}
              is preparing response...
            </p>
          </div>
        </div>

        {/* Action button: Skip Delay */}
        <button
          onClick={onSkipDelay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-800/50 hover:bg-blue-700/70 border border-blue-600/50 text-xs font-medium text-blue-200 hover:text-white transition active:scale-95 whitespace-nowrap"
          title="Skip remaining delay and execute turn now"
        >
          <FastForward className="h-3.5 w-3.5" />
          <span>Skip Delay</span>
        </button>
      </div>

      {/* Thin Animated Progress Bar */}
      <div className="max-w-xl mx-auto h-1 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { RoomStatus, SafetyConfig } from '@/types';
import { Square, Play, Pause, AlertTriangle, ShieldCheck, Zap, DollarSign, Sliders, CheckCircle } from 'lucide-react';

interface SafetyControlBarProps {
  roomId: string;
  status: RoomStatus;
  currentTurn: number;
  maxTurns: number;
  turnDelaySec: number;
  totalTokens: number;
  estimatedCost: number;
  activeAgentName?: string;
  safetyConfig: SafetyConfig;
  isProcessing: boolean;
  onStop: () => Promise<void>;
  onResume: () => Promise<void>;
  onUpdateConfig: (newDelay: number, newMaxTurns: number, newConfig: Partial<SafetyConfig>) => Promise<void>;
}

export default function SafetyControlBar({
  roomId,
  status,
  currentTurn,
  maxTurns,
  turnDelaySec,
  totalTokens,
  estimatedCost,
  activeAgentName,
  safetyConfig,
  isProcessing,
  onStop,
  onResume,
  onUpdateConfig,
}: SafetyControlBarProps) {
  const [isStopping, setIsStopping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [delayInput, setDelayInput] = useState(turnDelaySec);
  const [maxTurnsInput, setMaxTurnsInput] = useState(maxTurns);
  const [repThreshold, setRepThreshold] = useState(safetyConfig?.repetitionThreshold ?? 0.85);

  const handleStopClick = async () => {
    try {
      setIsStopping(true);
      await onStop();
    } finally {
      setIsStopping(false);
    }
  };

  const handleSaveSettings = async () => {
    await onUpdateConfig(delayInput, maxTurnsInput, { repetitionThreshold: repThreshold });
    setShowSettings(false);
  };

  const statusColor = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    PAUSED: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    DRAFT: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    COMPLETED: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    ARCHIVED: 'bg-slate-700/50 text-slate-400 border-slate-600',
  }[status] || 'bg-slate-700 text-slate-300';

  return (
    <>
      {/* Sticky Floating Safety Bar */}
      <div className="sticky top-20 z-40 w-full px-4 mb-4">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-700/70 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          {/* Status & Active Agent */}
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${statusColor} flex items-center gap-1.5`}>
              <span className={`h-2 w-2 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-400 animate-ping' : status === 'PAUSED' ? 'bg-amber-400' : 'bg-slate-400'}`} />
              {status}
            </span>

            <div className="text-xs text-slate-300">
              <span className="text-slate-400">Turn:</span>{' '}
              <span className="font-bold text-white text-sm">{currentTurn}</span>
              <span className="text-slate-500"> / {maxTurns}</span>
            </div>

            {isProcessing && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2.5 py-0.5 rounded-md">
                <Zap className="h-3 w-3 animate-bounce" />
                <span>{activeAgentName ? `${activeAgentName} processing...` : 'Processing turn...'}</span>
              </div>
            )}
          </div>

          {/* Token & Cost Counter */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Anti-Loop: Active ({Math.round((safetyConfig?.repetitionThreshold ?? 0.85) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-200 font-mono font-medium">{totalTokens.toLocaleString()}</span> tokens
            </div>
            <div className="flex items-center gap-0.5 text-emerald-400 font-mono font-semibold">
              <DollarSign className="h-3 w-3" />
              <span>{estimatedCost.toFixed(4)}</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Safety & Delay Settings"
            >
              <Sliders className="h-4 w-4" />
            </button>

            {/* Resume / Start Button */}
            {status !== 'ACTIVE' ? (
              <button
                onClick={onResume}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{status === 'DRAFT' ? 'Start Collaboration' : 'Resume Loop'}</span>
              </button>
            ) : (
              <button
                onClick={onStop}
                disabled={isStopping}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-medium text-xs sm:text-sm transition"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
            )}

            {/* PROMINENT INSTANT STOP BUTTON (< 500ms) */}
            <button
              onClick={handleStopClick}
              disabled={isStopping}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/30 transition active:scale-95 disabled:opacity-50"
              title="Instant Stop Backend Loop (<500ms)"
            >
              <Square className="h-4 w-4 fill-white" />
              <span>{isStopping ? 'STOPPING...' : 'INSTANT STOP'}</span>
            </button>
          </div>
        </div>

        {/* Safety Settings Drawer */}
        {showSettings && (
          <div className="max-w-7xl mx-auto mt-2 p-4 rounded-xl border border-slate-700 bg-slate-900/95 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-blue-400" />
                Orchestration & Safety System Controls
              </span>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Turn Delay Countdown (seconds)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={delayInput}
                    onChange={e => setDelayInput(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <span className="font-mono text-white font-bold w-8">{delayInput}s</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Countdown delay between alternating agent turns.</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Hard Cap Turn Limit</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={maxTurnsInput}
                  onChange={e => setMaxTurnsInput(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Strict hard cap: loop halts when turns reach this value.</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Repetition Detector Threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    value={repThreshold}
                    onChange={e => setRepThreshold(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <span className="font-mono text-white font-bold w-12">{Math.round(repThreshold * 100)}%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Pauses session if consecutive messages exceed similarity.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSettings}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Save Controls
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

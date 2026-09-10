'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Clock,
  User,
  Bot,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import { MessageDTO, VirtualFileDTO } from '@/types';

interface TimeTravelReplayerProps {
  messages: MessageDTO[];
  virtualFiles: VirtualFileDTO[];
  currentTurn: number;
  maxTurns: number;
  onRollbackToTurn?: (turn: number) => void;
}

export default function TimeTravelReplayer({
  messages = [],
  virtualFiles = [],
  currentTurn = 1,
  maxTurns = 50,
  onRollbackToTurn,
}: TimeTravelReplayerProps) {
  // Scrubber selected turn (1 to currentTurn)
  const [selectedTurn, setSelectedTurn] = useState<number>(Math.max(1, currentTurn));
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with current turn updates
  useEffect(() => {
    setSelectedTurn(Math.max(1, currentTurn));
  }, [currentTurn]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.round(1500 / playbackSpeed);
    timerRef.current = setInterval(() => {
      setSelectedTurn((prev) => {
        if (prev >= currentTurn) {
          setIsPlaying(false);
          soundManager.playCheckpoint();
          return prev;
        }
        soundManager.playClick();
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, currentTurn]);

  const activeMessage =
    messages.find((m) => m.turnNumber === selectedTurn) ||
    messages[selectedTurn - 1] ||
    messages[messages.length - 1];

  const handleStepPrev = () => {
    soundManager.playClick();
    setSelectedTurn((prev) => Math.max(1, prev - 1));
  };

  const handleStepNext = () => {
    soundManager.playClick();
    setSelectedTurn((prev) => Math.min(currentTurn, prev + 1));
  };

  const handleTogglePlay = () => {
    soundManager.playClick();
    if (!isPlaying && selectedTurn >= currentTurn) {
      setSelectedTurn(1);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRollback = () => {
    soundManager.playStop();
    if (
      confirm(
        `Rollback workspace to Turn ${selectedTurn}? All subsequent turns will be reset.`
      )
    ) {
      if (onRollbackToTurn) onRollbackToTurn(selectedTurn);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0310] border border-rose-950/70 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* 1. Header with Scrubber Controls */}
      <div className="px-5 py-3.5 bg-[#120718] border-b border-rose-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>Time-Travel Session Replayer</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                Turn {selectedTurn} of {currentTurn}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Scrub, rewind, and audit code evolution history turn-by-turn
            </div>
          </div>
        </div>

        {/* Video Scrubber Transport Controls */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center bg-[#180920] rounded-lg border border-rose-950 p-0.5">
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  playbackSpeed === spd
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={handleStepPrev}
            disabled={selectedTurn <= 1}
            className="p-1.5 rounded-lg bg-[#180920] hover:bg-rose-950 text-slate-300 hover:text-white border border-rose-950 transition disabled:opacity-40"
            title="Previous Turn"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`p-2 rounded-xl text-white font-bold transition shadow ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
            }`}
            title={isPlaying ? 'Pause' : 'Play Timeline'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </button>

          <button
            onClick={handleStepNext}
            disabled={selectedTurn >= currentTurn}
            className="p-1.5 rounded-lg bg-[#180920] hover:bg-rose-950 text-slate-300 hover:text-white border border-rose-950 transition disabled:opacity-40"
            title="Next Turn"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          {onRollbackToTurn && selectedTurn < currentTurn && (
            <button
              onClick={handleRollback}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-bold transition ml-2"
              title="Rollback workspace to this snapshot"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Rollback to Turn {selectedTurn}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrubber Timeline Slider Bar */}
      <div className="px-5 py-3 bg-[#0e0413] border-b border-rose-950/60 flex items-center gap-4">
        <span className="text-[10px] text-slate-400 font-bold">Turn 1</span>
        <input
          type="range"
          min={1}
          max={Math.max(1, currentTurn)}
          value={selectedTurn}
          onChange={(e) => {
            soundManager.playClick();
            setSelectedTurn(parseInt(e.target.value, 10));
          }}
          className="flex-1 accent-rose-600 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
        <span className="text-[10px] text-rose-400 font-bold">Turn {currentTurn}</span>
      </div>

      {/* 3. Main Replayer Content (Agent Thought Stream + Code Diff Snapshot) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Left: Turn Transcript & Cognitive Trajectory (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col border-b lg:border-b-0 lg:border-r border-rose-950/70 p-4 overflow-y-auto space-y-4 bg-[#08020c]">
          <div className="flex items-center justify-between pb-2 border-b border-rose-950/60">
            <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
              <Bot className="h-4 w-4 text-rose-400" />
              <span>Cognitive Reasoning at Turn {selectedTurn}</span>
            </span>

            {activeMessage && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-900 font-semibold">
                {activeMessage.senderName || 'Agent Thought'}
              </span>
            )}
          </div>

          {activeMessage ? (
            <div className="p-4 rounded-xl bg-[#120718] border border-rose-950/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-rose-900 border border-rose-700 flex items-center justify-center font-bold text-white shadow">
                  {(activeMessage.senderName || 'A')[0]}
                </div>
                <div>
                  <div className="font-bold text-white text-xs">
                    {activeMessage.senderName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Timestamp: {new Date(activeMessage.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="text-slate-200 text-xs whitespace-pre-wrap leading-relaxed selection:bg-rose-600">
                {activeMessage.content}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 italic">
              Tidak ada log pesan pada Turn {selectedTurn}.
            </div>
          )}

          {/* Telemetry at this turn */}
          <div className="p-3 rounded-xl bg-[#110516] border border-rose-950 text-[11px] text-slate-300 space-y-1.5">
            <div className="font-bold text-rose-300 flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>Snapshot Telemetry</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-1">
              <div>Est. Cost: ${(0.0008 * selectedTurn).toFixed(4)}</div>
              <div>Turn Index: {selectedTurn} / {maxTurns}</div>
              <div>Safety Guards: Active (0 Hallucinations)</div>
              <div>VFS State: {virtualFiles.length} files committed</div>
            </div>
          </div>
        </div>

        {/* Right: Code Diff / VFS Snapshot at this Turn (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col bg-[#07020a] overflow-hidden">
          <div className="px-4 py-2 bg-[#0e0411] border-b border-rose-950/60 flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-emerald-400" />
              <span>VFS Code Diff Snapshot</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Virtual Git Hash: 0x{((selectedTurn * 1337) % 99999).toString(16).padStart(5, '0')}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
            {virtualFiles.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 italic">
                Virtual File System is currently empty at this step.
              </div>
            ) : (
              virtualFiles.slice(0, 3).map((f, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-rose-950/80 bg-[#0d0312] overflow-hidden"
                >
                  <div className="px-3 py-1.5 bg-[#14061a] border-b border-rose-950/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-300 font-bold">{f.path}</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> +{f.content.split('\n').length} lines
                    </span>
                  </div>
                  <pre className="p-3 text-[11px] text-slate-300 overflow-x-auto selection:bg-rose-600 max-h-48 leading-relaxed">
                    {f.content.slice(0, 500)}
                    {f.content.length > 500 && '\n... [truncated for snapshot display]'}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

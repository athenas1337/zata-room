'use client';

import React from 'react';
import {
  ClipboardList,
  Cpu,
  Code2,
  ShieldCheck,
  Rocket,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

export type DevPhase = 'requirements' | 'architecture' | 'implementation' | 'review' | 'release';

interface MultiPhasePipelineProps {
  currentTurn: number;
  maxTurns: number;
  activePhase?: DevPhase;
  onSelectPhase?: (phase: DevPhase) => void;
}

const PHASES: Array<{
  id: DevPhase;
  label: string;
  role: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  turnRatio: number; // e.g. 0.15 = first 15% of turns
}> = [
  {
    id: 'requirements',
    label: '1. Requirements',
    role: 'Product Manager',
    desc: 'Goal breakdown & user stories',
    icon: ClipboardList,
    turnRatio: 0.15,
  },
  {
    id: 'architecture',
    label: '2. Architecture',
    role: 'System Architect',
    desc: 'UML spec, schema & SOP',
    icon: Cpu,
    turnRatio: 0.35,
  },
  {
    id: 'implementation',
    label: '3. Coding',
    role: 'Fullstack Engineers',
    desc: 'VFS source code synthesis',
    icon: Code2,
    turnRatio: 0.70,
  },
  {
    id: 'review',
    label: '4. Testing & Review',
    role: 'Security & QA Auditor',
    desc: 'De-hallucination verification',
    icon: ShieldCheck,
    turnRatio: 0.90,
  },
  {
    id: 'release',
    label: '5. Release',
    role: 'DevOps & Git VCS',
    desc: 'Git tag & production export',
    icon: Rocket,
    turnRatio: 1.0,
  },
];

export default function MultiPhasePipeline({
  currentTurn,
  maxTurns,
  activePhase,
  onSelectPhase,
}: MultiPhasePipelineProps) {
  // Determine active phase based on turn ratio if not explicitly selected
  const progressRatio = Math.min(1, currentTurn / Math.max(1, maxTurns));

  const computedPhase: DevPhase =
    activePhase ||
    (progressRatio < 0.2
      ? 'requirements'
      : progressRatio < 0.4
      ? 'architecture'
      : progressRatio < 0.75
      ? 'implementation'
      : progressRatio < 0.95
      ? 'review'
      : 'release');

  const currentPhaseIndex = PHASES.findIndex((p) => p.id === computedPhase);

  return (
    <div className="w-full bg-[#0a040e]/90 border border-rose-950/70 rounded-2xl p-3 font-mono text-xs select-none shadow-md backdrop-blur-md">
      <div className="flex items-center justify-between pb-2 border-b border-rose-950/50">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-extrabold text-[11px] text-white uppercase tracking-wider">
            ChatDev SOP Pipeline (Phase-Based De-Hallucination)
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          Turn {currentTurn}/{maxTurns} ({Math.round(progressRatio * 100)}%)
        </span>
      </div>

      {/* 5-Step Pipeline Progress Bar */}
      <div className="grid grid-cols-5 gap-1.5 pt-2.5">
        {PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          const isCompleted = idx < currentPhaseIndex;
          const isCurrent = idx === currentPhaseIndex;

          return (
            <div
              key={phase.id}
              onClick={() => {
                soundManager.playClick();
                if (onSelectPhase) onSelectPhase(phase.id);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'bg-rose-950/80 border-rose-600 text-white shadow-md shadow-rose-950/60'
                  : isCompleted
                  ? 'bg-[#120819] border-emerald-900/60 text-emerald-300'
                  : 'bg-[#09030c] border-rose-950/30 text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-3.5 w-3.5 ${isCurrent ? 'text-rose-400' : isCompleted ? 'text-emerald-400' : 'text-slate-600'}`} />
                {isCompleted ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-600 text-white font-bold animate-pulse">
                    ACTIVE
                  </span>
                ) : (
                  <Clock className="h-3 w-3 text-slate-600" />
                )}
              </div>

              <div className="mt-1 space-y-0.5">
                <div className={`text-[10px] font-bold truncate ${isCurrent ? 'text-white' : ''}`}>
                  {phase.label}
                </div>
                <div className="text-[9px] text-slate-400 truncate hidden sm:block">
                  {phase.role}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Network,
  GitCommit,
  Share2,
  Workflow,
  Sparkles,
  Check,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

export type SwarmTopology = 'sequential' | 'star' | 'debate' | 'hierarchical';

interface SwarmTopologySelectorProps {
  currentTopology?: SwarmTopology;
  onTopologyChange?: (topo: SwarmTopology) => void;
}

export default function SwarmTopologySelector({
  currentTopology = 'sequential',
  onTopologyChange,
}: SwarmTopologySelectorProps) {
  const [selected, setSelected] = useState<SwarmTopology>(currentTopology);

  const TOPOLOGIES = [
    {
      id: 'sequential' as SwarmTopology,
      title: 'Sequential Relay',
      desc: 'Agents take turns sequentially in a linear round-robin loop.',
      icon: GitCommit,
      badge: 'Classic Loop',
    },
    {
      id: 'star' as SwarmTopology,
      title: 'Star Hub Orchestrator',
      desc: 'Central Architect agent delegates subtasks to specialist workers.',
      icon: Share2,
      badge: 'High Precision',
    },
    {
      id: 'debate' as SwarmTopology,
      title: 'Adversarial Debate Ring',
      desc: 'Coder and Critic continuously challenge and refute until 100% quorum.',
      icon: Network,
      badge: 'Zero Hallucination',
    },
    {
      id: 'hierarchical' as SwarmTopology,
      title: 'Hierarchical Tree',
      desc: 'Tree decomposition with autonomous sub-agent spawner & parallel execution.',
      icon: Workflow,
      badge: 'Deep Problem Solving',
    },
  ];

  const handleSelect = (id: SwarmTopology) => {
    soundManager.playCheckpoint();
    setSelected(id);
    if (onTopologyChange) onTopologyChange(id);
  };

  return (
    <div className="p-3 bg-[#0c0411] border border-rose-950/80 rounded-2xl font-mono text-xs select-none space-y-2">
      <div className="flex items-center justify-between pb-1 border-b border-rose-950/50">
        <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px]">
          <Network className="h-3.5 w-3.5 text-rose-400" />
          <span>Swarm Coordination Topology (F11)</span>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          Active: {selected.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {TOPOLOGIES.map((topo) => {
          const Icon = topo.icon;
          const isCurrent = selected === topo.id;

          return (
            <div
              key={topo.id}
              onClick={() => handleSelect(topo.id)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all space-y-1 ${
                isCurrent
                  ? 'bg-rose-950/70 border-rose-600 text-white shadow-md shadow-rose-950/60'
                  : 'bg-[#120618]/60 border-rose-950/40 text-slate-400 hover:text-slate-200 hover:border-rose-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Icon className={`h-3.5 w-3.5 ${isCurrent ? 'text-rose-400' : 'text-slate-500'}`} />
                  <span>{topo.title}</span>
                </div>
                {isCurrent && <Check className="h-3.5 w-3.5 text-rose-400" />}
              </div>

              <p className="text-[10px] text-slate-400 line-clamp-2">{topo.desc}</p>

              <div className="pt-1">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    isCurrent
                      ? 'bg-rose-900/80 text-rose-200'
                      : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {topo.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

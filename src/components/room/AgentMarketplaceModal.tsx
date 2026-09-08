'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Bot,
  Shield,
  Zap,
  Cpu,
  Palette,
  Check,
  Search,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

export interface MarketplaceAgent {
  id: string;
  name: string;
  roleLabel: string;
  category: 'Architect' | 'Security' | 'Frontend' | 'Performance' | 'Testing';
  avatarColor: string;
  description: string;
  systemPrompt: string;
  recommendedModel: string;
  downloads: string;
}

const MARKETPLACE_AGENTS: MarketplaceAgent[] = [
  {
    id: 'lead-architect',
    name: 'Ada (Lead Architect)',
    roleLabel: 'Software Architect',
    category: 'Architect',
    avatarColor: '#3b82f6',
    description: 'Designs clean domain architectures, modular schemas, and enforces SOLID design patterns.',
    systemPrompt: 'You are Ada, an elite Principal Software Architect. Focus on system modularity, clean interfaces, and scalable directory structure.',
    recommendedModel: 'gemini-2.5-flash',
    downloads: '2.4k',
  },
  {
    id: 'paranoid-security',
    name: 'Cipher (Zero-Day Auditor)',
    roleLabel: 'Security Engineer',
    category: 'Security',
    avatarColor: '#e11d48',
    description: 'Performs ruthless code review, identifies SQL injections, prototype pollution, and secrets leaks.',
    systemPrompt: 'You are Cipher, a paranoid Application Security Specialist. Analyze every code diff for vulnerabilities, injections, and edge cases.',
    recommendedModel: 'gemini-2.5-flash',
    downloads: '1.9k',
  },
  {
    id: 'tailwind-wizard',
    name: 'Pixel (UI/UX Stylist)',
    roleLabel: 'Frontend Craftsman',
    category: 'Frontend',
    avatarColor: '#8b5cf6',
    description: 'Crafts hypnotic cyber-noir aesthetics, reactive micro-interactions, and accessible CSS layouts.',
    systemPrompt: 'You are Pixel, a UI/UX expert obsessed with dark cyber aesthetics, fluid animations, and clean responsive CSS.',
    recommendedModel: 'gemini-2.5-flash',
    downloads: '3.1k',
  },
  {
    id: 'perf-rust',
    name: 'Velo (Engine Optimizer)',
    roleLabel: 'Performance Engineer',
    category: 'Performance',
    avatarColor: '#f59e0b',
    description: 'Specializes in low-latency algorithms, WebAssembly compilation, and memory leak elimination.',
    systemPrompt: 'You are Velo, a systems and performance fanatic. Optimize execution paths, minimize memory allocation, and verify latency.',
    recommendedModel: 'gemini-2.5-flash',
    downloads: '1.2k',
  },
  {
    id: 'qa-fuzzer',
    name: 'Chaos (Automated Tester)',
    roleLabel: 'QA & Test Engineer',
    category: 'Testing',
    avatarColor: '#10b981',
    description: 'Synthesizes exhaustive Jest/Vitest suites, property fuzzing tests, and boundary value tests.',
    systemPrompt: 'You are Chaos, an uncompromising QA Engineer. Write bulletproof test assertions and catch every elusive regression.',
    recommendedModel: 'gemini-2.5-flash',
    downloads: '1.8k',
  },
];

interface AgentMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agent: MarketplaceAgent) => void;
}

export default function AgentMarketplaceModal({
  isOpen,
  onClose,
  onSelectAgent,
}: AgentMarketplaceModalProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = MARKETPLACE_AGENTS.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || a.category.toLowerCase() === category.toLowerCase();
    return matchSearch && matchCat;
  });

  const handleChoose = (agent: MarketplaceAgent) => {
    soundManager.playCheckpoint();
    onSelectAgent(agent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0c0411] border border-rose-900/60 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 text-slate-200 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Community Agent Marketplace (F12)
              </h2>
              <p className="text-[11px] text-slate-400">
                Import pre-trained multi-agent personas and specialized prompt behaviors
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agent personas..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#130719] border border-rose-950 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'architect', 'security', 'frontend', 'testing'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundManager.playClick();
                  setCategory(cat);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition ${
                  category === cat
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#140719] text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className="p-3.5 rounded-xl bg-[#110517] border border-rose-950/60 hover:border-rose-700/60 transition flex flex-col justify-between space-y-2 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-7 w-7 rounded-full flex items-center justify-center font-bold text-white text-xs shadow"
                      style={{ backgroundColor: agent.avatarColor }}
                    >
                      {agent.name[0]}
                    </span>
                    <div>
                      <div className="font-bold text-white text-xs group-hover:text-rose-300 transition">
                        {agent.name}
                      </div>
                      <span className="text-[10px] text-slate-400">{agent.roleLabel}</span>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-bold uppercase">
                    {agent.category}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {agent.description}
                </p>
              </div>

              <div className="pt-2 border-t border-rose-950/40 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {agent.downloads} uses &bull; {agent.recommendedModel}
                </span>

                <button
                  onClick={() => handleChoose(agent)}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-md shadow-rose-600/20"
                >
                  <span>Select</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

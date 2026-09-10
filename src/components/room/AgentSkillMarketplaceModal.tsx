'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Code2,
  Database,
  Cpu,
  Terminal,
  Check,
  Plus,
  Search,
  Filter,
  Layers,
  Zap,
  HardDrive,
  X,
  BookOpen,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

export interface AgentSkill {
  id: string;
  name: string;
  category: 'Security' | 'Full-Stack' | 'Architecture' | 'DevOps & QA';
  icon: any;
  version: string;
  author: string;
  installs: number;
  description: string;
  capabilities: string[];
  systemDirective: string;
  isInstalled?: boolean;
}

interface AgentSkillMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallSkill: (skill: AgentSkill) => void;
}

export default function AgentSkillMarketplaceModal({
  isOpen,
  onClose,
  onInstallSkill,
}: AgentSkillMarketplaceModalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'create'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [installedIds, setInstalledIds] = useState<string[]>([]);

  // Form states for Custom Skill Creator
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<'Security' | 'Full-Stack' | 'Architecture' | 'DevOps & QA'>('Full-Stack');
  const [customDescription, setCustomDescription] = useState('');
  const [customDirective, setCustomDirective] = useState('');

  const [skills, setSkills] = useState<AgentSkill[]>([
    {
      id: 'skill-smart-contract',
      name: 'Smart Contract Auditor',
      category: 'Security',
      icon: ShieldAlert,
      version: 'v2.4.0',
      author: 'ZATA Security Lab',
      installs: 1420,
      description: 'Audit bytecode Solidity, reentrancy guards, flashloan invariance, dan gas optimization.',
      capabilities: ['Reentrancy Attack Detector', 'Gas Profiler', 'Slither Rule Synthesizer'],
      systemDirective: 'Focus exclusively on smart contract vulnerability analysis, reentrancy mitigation, and byte-level gas optimization.',
    },
    {
      id: 'skill-owasp-pentester',
      name: 'OWASP Pentester Guard',
      category: 'Security',
      icon: ShieldAlert,
      version: 'v3.1.2',
      author: 'Cyber-Noir Squad',
      installs: 2890,
      description: 'Pemindai otomatis SQL Injection, XSS sanitization, SSRF vectors, dan kebocoran credential.',
      capabilities: ['OWASP Top 10 Scrutiny', 'Secret Leak Heuristics', 'Zero-Day Shield'],
      systemDirective: 'Prioritize defensive coding standards, input sanitization, and elimination of sensitive secret exposures.',
    },
    {
      id: 'skill-tailwind-alchemist',
      name: 'Tailwind UI/UX Alchemist',
      category: 'Full-Stack',
      icon: Code2,
      version: 'v4.0.1',
      author: 'Makima Design System',
      installs: 3940,
      description: 'Membangun antarmuka modern glassmorphism, responsive grid, dan transisi micro-interactions.',
      capabilities: ['Tailwind v3/v4 Styling', 'Dark/Cyber-Noir Palette', 'Viewport Responsiveness'],
      systemDirective: 'Generate ultra-modern, aesthetic Tailwind CSS interfaces with smooth micro-interactions and dark-mode elegance.',
    },
    {
      id: 'skill-database-architect',
      name: 'Database Schema Architect',
      category: 'Architecture',
      icon: Database,
      version: 'v2.8.0',
      author: 'Postgres Core Team',
      installs: 1980,
      description: 'Perancang skema relasional efisien, index B-Tree / GIN, dan query planner optimization.',
      capabilities: ['Advisory Locking Patterns', 'Index Selectivity Analysis', 'Connection Pool Tuning'],
      systemDirective: 'Design high-throughput, normalized relational schemas with zero query bottleneck and optimal locking mechanisms.',
    },
    {
      id: 'skill-devops-cicd',
      name: 'DevOps & CI/CD Master',
      category: 'DevOps & QA',
      icon: Cpu,
      version: 'v1.9.5',
      author: 'Cloud Native Guild',
      installs: 1650,
      description: 'Pipeline GitHub Actions, Docker multi-stage build, zero-downtime blue/green deployment.',
      capabilities: ['GitHub Actions Workflows', 'Multi-Stage Dockerfiles', 'Health-Check Probes'],
      systemDirective: 'Formulate robust CI/CD automation pipelines, minimal container footprints, and resilient build triggers.',
    },
    {
      id: 'skill-automated-testing',
      name: 'Automated Test Engineer',
      category: 'DevOps & QA',
      icon: Terminal,
      version: 'v2.2.0',
      author: 'QA Automation Lab',
      installs: 2120,
      description: 'Pembuat suite pengujian Jest, unit test assertions, edge-case mocks, dan Playwright E2E.',
      capabilities: ['Jest Unit Test Generation', 'Mock Factory Pattern', '100% Branch Coverage Target'],
      systemDirective: 'Author comprehensive automated test suites with high code branch coverage and rigorous edge-case assertions.',
    },
    {
      id: 'skill-api-security',
      name: 'API Security Gatekeeper',
      category: 'Security',
      icon: Zap,
      version: 'v2.0.4',
      author: 'Auth Guard Group',
      installs: 1730,
      description: 'Perlindungan endpoint API, JWT token validation, HMAC signatures, dan token bucket rate limit.',
      capabilities: ['JWT Rotation Strategy', 'Rate Limit Enforcement', 'CORS & CSP Headers'],
      systemDirective: 'Safeguard REST and WebSocket endpoints with strict authentication, rate-limiting, and encryption guards.',
    },
    {
      id: 'skill-performance-profiler',
      name: 'System Performance Profiler',
      category: 'Architecture',
      icon: HardDrive,
      version: 'v1.5.0',
      author: 'V8 Runtime Engineers',
      installs: 1240,
      description: 'Analisis memory leak, zero-copy buffer caching, dan pengurangan bundle size Next.js.',
      capabilities: ['Heap Snapshot Diagnostics', 'Tree-Shaking Analyzer', 'Zero-Copy Streaming'],
      systemDirective: 'Optimize execution latency, eliminate unnecessary allocations, and maximize runtime throughput.',
    },
  ]);

  if (!isOpen) return null;

  const handleInstall = (skill: AgentSkill) => {
    soundManager.playSuccess();
    setInstalledIds((prev) => [...prev, skill.id]);
    onInstallSkill(skill);
  };

  const handleCreateCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customDirective) return;
    soundManager.playCheckpoint();

    const newSkill: AgentSkill = {
      id: `custom-skill-${Date.now()}`,
      name: customName,
      category: customCategory,
      icon: Sparkles,
      version: 'v1.0.0 (Custom)',
      author: 'Atha (Creator)',
      installs: 1,
      description: customDescription || 'Custom specialist directive authored by developer.',
      capabilities: ['User-Defined Directive', 'Instant Swarm Injection'],
      systemDirective: customDirective,
    };

    setSkills((prev) => [newSkill, ...prev]);
    handleInstall(newSkill);
    setActiveTab('catalog');
    setCustomName('');
    setCustomDirective('');
    setCustomDescription('');
  };

  const filteredSkills = skills.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#0b0310] border-2 border-rose-950/80 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] font-mono text-xs">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#130718] border-b border-rose-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white shadow">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>Agent Skill &amp; Plugin Marketplace</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                  {skills.length} Certified Skills
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Enhance your multi-agent swarm with specialized expert capabilities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center gap-1 bg-[#180920] p-1 rounded-xl border border-rose-950">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('catalog');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'catalog'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Skill Catalog
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('create');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  activeTab === 'create'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="h-3 w-3" />
                <span>Create Skill</span>
              </button>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#180920] hover:bg-rose-950 text-slate-400 hover:text-white border border-rose-950 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Catalog */}
        {activeTab === 'catalog' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search & Category Filter Bar */}
            <div className="px-5 py-3 bg-[#0f0515] border-b border-rose-950/60 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari keahlian agen (e.g. security, tailwind, database)..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#180920] border border-rose-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-600 text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['All', 'Security', 'Full-Stack', 'Architecture', 'DevOps & QA'].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedCategory(cat);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-rose-600 text-white'
                          : 'bg-[#180920] text-slate-400 hover:text-white border border-rose-950'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Skills Grid */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSkills.map((s) => {
                const Icon = s.icon;
                const isInstalled = installedIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-[#120718] border border-rose-950/80 hover:border-rose-800/80 flex flex-col justify-between space-y-3 transition duration-200 shadow-md group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-[#1c0a24] border border-rose-700/60 flex items-center justify-center text-rose-400 group-hover:scale-105 transition">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{s.name}</span>
                              <span className="text-[10px] text-slate-500">{s.version}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              by {s.author} &bull; {s.installs.toLocaleString()} installs
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-900 font-bold shrink-0">
                          {s.category}
                        </span>
                      </div>

                      <p className="text-slate-300 text-xs mt-2.5 leading-relaxed line-clamp-2">
                        {s.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {s.capabilities.map((cap, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-[#180920] border border-rose-950 text-[10px] text-slate-400"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-rose-950/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 italic line-clamp-1 max-w-[200px]">
                        Directive: {s.systemDirective}
                      </span>

                      <button
                        onClick={() => handleInstall(s)}
                        disabled={isInstalled}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                          isInstalled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white'
                        }`}
                      >
                        {isInstalled ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Installed</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Install to Swarm</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Create Custom Skill */}
        {activeTab === 'create' && (
          <form
            onSubmit={handleCreateCustomSkill}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Next.js App Router Master"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#14061a] border border-rose-950 text-white focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#14061a] border border-rose-950 text-white focus:outline-none focus:border-rose-500 text-xs"
                >
                  <option value="Full-Stack">Full-Stack</option>
                  <option value="Security">Security</option>
                  <option value="Architecture">Architecture</option>
                  <option value="DevOps & QA">DevOps & QA</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Ringkasan tugas spesifik keahlian ini..."
                className="w-full px-3 py-2 rounded-xl bg-[#14061a] border border-rose-950 text-white focus:outline-none focus:border-rose-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Specialized System Directive (Prompts injected into agent)
              </label>
              <textarea
                value={customDirective}
                onChange={(e) => setCustomDirective(e.target.value)}
                rows={5}
                required
                placeholder="Instruksi kognitif spesifik yang harus ditaati oleh agen saat mengaktifkan skill ini..."
                className="w-full p-3 rounded-xl bg-[#14061a] border border-rose-950 text-white focus:outline-none focus:border-rose-500 text-xs font-mono"
              />
            </div>

            <div className="pt-4 border-t border-rose-950 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl bg-[#180920] text-slate-400 hover:text-white border border-rose-950 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Save &amp; Install Skill</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

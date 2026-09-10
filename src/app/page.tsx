'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  Play,
  RefreshCw,
  Lock,
  Globe,
  Key,
  Crown,
  Trash2,
  FolderTree,
  Terminal,
  Volume2,
  GitBranch,
  Star,
  Layers,
  Code2,
  Search,
  Radio,
  Sliders,
  CheckCircle2,
  Bot,
  Music,
  FileText,
  GitCommit,
  CheckSquare,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import MakimaLogo from '@/components/brand/MakimaLogo';
import GodModeModal from '@/components/admin/GodModeModal';
import DeleteRoomDialog from '@/components/room/DeleteRoomDialog';
import CommandPalette from '@/components/ide/CommandPalette';
import CommunityFooter from '@/components/room/CommunityFooter';
import PhonkRadioPlayer from '@/components/brand/PhonkRadioPlayer';

interface RoomSummary {
  id: string;
  name: string;
  goal: string;
  status: string;
  isPublic?: boolean;
  inviteCode?: string;
  currentTurn: number;
  maxTurns: number;
  turnDelaySec: number;
  participants: Array<{
    id: string;
    agentName: string;
    roleLabel: string;
    avatarColor: string;
    provider: string;
    modelName: string;
  }>;
  _count?: {
    messages: number;
    safetyEvents: number;
    virtualFiles?: number;
  };
}

export default function LobbyPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // GodMode & Host states
  const [isGodModeOpen, setIsGodModeOpen] = useState(false);
  const [hostRoomIds, setHostRoomIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'private'>('all');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'workspaces' | 'paradigms' | 'phonk'>('workspaces');

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // New room form state
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [turnDelaySec, setTurnDelaySec] = useState(5);
  const [maxTurns, setMaxTurns] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hero interactive CLI simulator command
  const [heroCommand, setHeroCommand] = useState('npm test');
  const [heroOutput, setHeroOutput] = useState(
    'PASS src/core/engine.spec.ts\n ✓ anti-infinite-loop guard active (18ms)\n ✓ autonomous swarm synchronization passed (12ms)\nTest Suites: 1 passed, 1 total\nTime: 0.624s'
  );

  // Load host secrets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zata_host_secrets');
      if (stored) {
        const map = JSON.parse(stored);
        setHostRoomIds(new Set(Object.keys(map)));
      }
    } catch (e) {}
  }, []);

  // Keyboard shortcut for Developer Godmode: Ctrl + Shift + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        soundManager.playCheckpoint();
        setIsGodModeOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        soundManager.playClick();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch('/api/rooms', { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success && Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !goal.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      soundManager.playCheckpoint();
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          goal: goal.trim(),
          isPublic,
          turnDelaySec,
          maxTurns,
          safetyConfig: {
            repetitionThreshold: 0.85,
            maxTurns,
            maxBudgetUsd: 2.0,
            echoThreshold: 0.8,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.room?.id) {
        try {
          const stored = localStorage.getItem('zata_host_secrets') || '{}';
          const secrets = JSON.parse(stored);
          secrets[data.room.id] = data.room.hostSecret;
          localStorage.setItem('zata_host_secrets', JSON.stringify(secrets));
        } catch (e) {}

        router.push(`/rooms/${data.room.id}`);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuickDemo = async () => {
    try {
      setIsSubmitting(true);
      soundManager.playCheckpoint();
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Distributed Cloud Architecture & Security Audit',
          goal: 'Architect a fault-tolerant multi-region payment gateway with idempotency keys, rate limiting, and write the complete system design in the shared scratchpad.',
          isPublic: true,
          turnDelaySec: 4,
          maxTurns: 30,
        }),
      });
      const data = await res.json();
      if (data.success && data.room?.id) {
        try {
          const stored = localStorage.getItem('zata_host_secrets') || '{}';
          const secrets = JSON.parse(stored);
          secrets[data.room.id] = data.room.hostSecret;
          localStorage.setItem('zata_host_secrets', JSON.stringify(secrets));
        } catch (e) {}

        router.push(`/rooms/${data.room.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;

    soundManager.playCheckpoint();
    router.push(`/rooms/lookup?code=${code}`);
  };

  const handleHeroRunCommand = (cmd: string) => {
    soundManager.playClick();
    setHeroCommand(cmd);
    if (cmd === 'npm test') {
      setHeroOutput('PASS src/core/engine.spec.ts\n ✓ anti-loop repetition threshold checked\n ✓ sandboxed VFS security clean\nAll 6 tests passed in 0.41s');
    } else if (cmd === 'git status') {
      setHeroOutput('On branch main\nChanges to be committed:\n  modified: src/orchestrator/zata.ts\n  modified: README.md\nSwarm ready to commit.');
    } else if (cmd === 'zata agent status') {
      setHeroOutput('ZATA Swarm: 3 agents online\n • Architect Alpha [Lead]\n • Coder Beta [Autonomous Fullstack]\n • Auditor Gamma [Security Critic]');
    } else {
      setHeroOutput(`[Executed]: ${cmd}\nexit code: 0\nSandboxed execution verified.`);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesFilter =
      activeFilter === 'public'
        ? r.isPublic !== false
        : activeFilter === 'private'
        ? r.isPublic === false
        : true;

    const matchesSearch =
      r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.goal.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.inviteCode?.toLowerCase().includes(searchFilter.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* 1. HERO SECTION: Cyber-Noir & Interactive Playground */}
      <div className="relative rounded-3xl border border-rose-950/60 bg-gradient-to-b from-[#130718]/90 via-[#0a040d]/90 to-[#070309] p-6 sm:p-10 overflow-hidden shadow-2xl">
        {/* Pinterest-style Cyber-Noir Ambient Background Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30 select-none">
          <img
            src="/images/makima_bg.jpg"
            alt="ZATA Ambient Anime Artwork"
            className="w-full h-full object-cover object-top filter contrast-125 saturate-125 mix-blend-screen"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0411] via-[#0d0411]/70 to-[#070309]/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070309] via-transparent to-transparent" />
        </div>

        {/* Background Ambient Glow motif */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Headline, Brand, CTA */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-700/60 text-xs font-mono font-bold text-rose-300 shadow-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>ZATA COMMUNITY</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-amber-400">Autonomous AI Swarm</span>
              </span>

              {/* Phonk Beat Drop Button */}
              <button
                onClick={() => soundManager.playJedagJedugBeat()}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-rose-900/60 to-red-900/60 hover:from-rose-800 hover:to-red-800 border border-rose-600/50 text-[11px] font-mono text-rose-200 font-bold transition flex items-center gap-1 shadow hover:scale-105 active:scale-95"
                title="Play 808 Phonk Bass Beat!"
              >
                <Volume2 className="h-3 w-3 text-rose-400" />
                <span>🔥 Drop Phonk Beat</span>
              </button>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              The Next-Gen{' '}
              <span className="bg-gradient-to-r from-rose-500 via-red-400 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(225,29,72,0.6)]">
                Agentic Cloud IDE
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Unleash autonomous AI pairing inside a real GitHub-grade workspace.
              Equipped with in-room virtual file system (VFS), integrated multi-tab bash terminal, and host ownership control.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsCreateOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Create Agentic Room</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsJoinOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#140819] hover:bg-[#1a0b21] border border-rose-950 text-slate-200 font-semibold text-sm transition font-mono"
              >
                <Key className="h-4 w-4 text-amber-400" />
                <span>Join with Passcode</span>
              </button>

              <button
                onClick={handleCreateQuickDemo}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs font-mono transition"
              >
                <Play className="h-3.5 w-3.5 text-emerald-400" />
                <span>Quick Demo</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Live IDE Mockup Playground */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-rose-950/70 bg-[#0c0510] shadow-2xl overflow-hidden font-mono text-xs">
              {/* Fake IDE Header */}
              <div className="px-4 py-2.5 bg-[#120718] border-b border-rose-950/70 flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] font-bold text-rose-300">zata-workspace &bull; main</span>
                </div>
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <Radio className="h-3 w-3 animate-pulse" /> Live Swarm
                </span>
              </div>

              {/* Fake Editor & Code Preview */}
              <div className="p-4 bg-[#08030b] space-y-1.5 text-[11px] text-rose-100/90 leading-relaxed border-b border-rose-950/50">
                <div className="text-slate-500">// ZATA Autonomous Multi-Agent Swarm Loop</div>
                <div>
                  <span className="text-rose-400">export async function</span>{' '}
                  <span className="text-amber-300">orchestrateSwarm</span>(goal:{' '}
                  <span className="text-emerald-400">string</span>) &#123;
                </div>
                <div className="pl-4">
                  <span className="text-rose-400">const</span> agents = [
                  <span className="text-emerald-300">&quot;Architect Alpha&quot;</span>,{' '}
                  <span className="text-emerald-300">&quot;Coder Beta&quot;</span>];
                </div>
                <div className="pl-4">
                  <span className="text-rose-400">await</span> zata.executeTurn(agents, &#123;{' '}
                  <span className="text-amber-400">vfs</span>: <span className="text-cyan-400">true</span> &#125;);
                </div>
                <div>&#125;</div>
              </div>

              {/* Interactive Mini Terminal inside Hero */}
              <div className="p-3 bg-[#0a040e] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Terminal className="h-3 w-3 text-rose-400" /> Interactive CLI:
                  </span>
                  <div className="flex items-center gap-1">
                    {['npm test', 'git status', 'zata agent status'].map((c) => (
                      <button
                        key={c}
                        onClick={() => handleHeroRunCommand(c)}
                        className={`px-2 py-0.5 rounded text-[10px] transition ${
                          heroCommand === c
                            ? 'bg-rose-950 text-rose-300 border border-rose-700'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <pre className="p-2.5 rounded-lg bg-[#060208] text-rose-200/90 text-[10px] font-mono whitespace-pre-wrap border border-rose-950/40">
                  <span className="text-rose-500 font-bold">$ {heroCommand}</span>
                  {'\n'}
                  {heroOutput}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN DASHBOARD TABS (Streamlined, Professional, Zero-Clutter) */}
      <div className="space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-950/70 pb-3">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#110617] border border-rose-950 text-xs font-mono">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveDashboardTab('workspaces');
              }}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
                activeDashboardTab === 'workspaces'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="h-4 w-4" />
              <span>Workspaces ({rooms.length})</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveDashboardTab('paradigms');
              }}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
                activeDashboardTab === 'paradigms'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="h-4 w-4 text-amber-400" />
              <span>5 Swarm Paradigms</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                GitHub
              </span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveDashboardTab('phonk');
              }}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
                activeDashboardTab === 'phonk'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="h-4 w-4 text-rose-400" />
              <span>Drift Phonk Lounge</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                Viral Drift
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-slate-500 hidden sm:inline">Palette:</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#130718] border border-rose-950 text-rose-300 font-bold">
              Ctrl + K
            </span>
          </div>
        </div>

        {/* TAB 1: WORKSPACES DIRECTORY */}
        {activeDashboardTab === 'workspaces' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Filter bar & search */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-950/50 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                  <FolderTree className="h-4 w-4 text-rose-400" />
                  <span>Active Agentic Workspaces</span>
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 font-mono font-bold">
                  {filteredRooms.length}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Find a workspace..."
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-[#120718] border border-rose-950 text-xs text-rose-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono w-48 sm:w-64"
                  />
                </div>

                {/* Visibility Filter Tabs */}
                <div className="flex items-center p-1 rounded-xl bg-[#120718] border border-rose-950 text-xs font-mono">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'public', label: 'Public', icon: Globe },
                    { id: 'private', label: 'Invite-Only', icon: Lock },
                  ].map((f) => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          soundManager.playClick();
                          setActiveFilter(f.id as any);
                        }}
                        className={`px-3 py-1 rounded-lg transition flex items-center gap-1 font-semibold ${
                          activeFilter === f.id
                            ? 'bg-rose-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {Icon && <Icon className="h-3 w-3" />}
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    fetchRooms();
                  }}
                  className="p-2 rounded-xl bg-[#140819] hover:bg-rose-950 text-slate-400 hover:text-white border border-rose-950 transition"
                  title="Refresh repository list"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Workspaces Grid */}
            {loading ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-rose-500" />
                <span className="text-xs font-mono">Loading agentic workspaces...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-16 text-center rounded-3xl border border-dashed border-rose-950/60 bg-[#0d0512]/60 space-y-4">
                <Code2 className="h-12 w-12 text-rose-900/60 mx-auto" />
                <h3 className="text-base font-bold text-slate-300">No matching workspaces found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono">
                  Create a new room or join with an invite code to begin autonomous AI pairing.
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition"
                >
                  Create New Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRooms.map((r) => {
                  const isUserHost = hostRoomIds.has(r.id);
                  const statusColor = {
                    ACTIVE: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
                    PAUSED: 'bg-amber-950/80 text-amber-300 border-amber-800',
                    DRAFT: 'bg-blue-950/80 text-blue-300 border-blue-800',
                    COMPLETED: 'bg-purple-950/80 text-purple-300 border-purple-800',
                  }[r.status] || 'bg-slate-900 text-slate-300 border-slate-800';

                  return (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl bg-[#0f0715] border border-rose-950/60 hover:border-rose-600/70 hover:bg-[#14091a] transition-all flex flex-col justify-between group shadow-xl relative"
                    >
                      <div className="space-y-3">
                        {/* Header line */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
                              {r.status}
                            </span>

                            {r.isPublic === false ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/80 flex items-center gap-1 font-mono">
                                <Lock className="h-2.5 w-2.5" /> Private
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1 font-mono">
                                <Globe className="h-2.5 w-2.5" /> Public
                              </span>
                            )}

                            {isUserHost && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/80 flex items-center gap-1 font-bold font-mono">
                                <Crown className="h-2.5 w-2.5 text-amber-400" /> Host
                              </span>
                            )}
                          </div>

                          {r.inviteCode && (
                            <span className="text-[10px] font-mono text-amber-400/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                              {r.inviteCode}
                            </span>
                          )}
                        </div>

                        {/* Title & Goal */}
                        <div>
                          <Link href={`/rooms/${r.id}`}>
                            <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition line-clamp-1">
                              {r.name}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-mono">
                            {r.goal}
                          </p>
                        </div>

                        {/* Turn Progress */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span>Execution Turn</span>
                            <span className="text-rose-300 font-bold">
                              {r.currentTurn || 0} / {r.maxTurns || 50}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-rose-950/40">
                            <div
                              className="bg-gradient-to-r from-rose-600 to-amber-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, ((r.currentTurn || 1) / (r.maxTurns || 50)) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer & Actions */}
                        <div className="pt-4 mt-4 border-t border-rose-950/50 flex items-center justify-between text-xs text-slate-400 font-mono">
                          {/* Agent Avatars */}
                          <div className="flex items-center -space-x-1.5">
                            {r.participants.map((p) => (
                              <span
                                key={p.id}
                                className="h-6 w-6 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold text-white shadow"
                                style={{ backgroundColor: p.avatarColor }}
                                title={`${p.agentName} (${p.roleLabel})`}
                              >
                                {p.agentName[0]}
                              </span>
                            ))}
                            {r.participants.length === 0 && (
                              <span className="text-[10px] text-slate-500 italic">0 agents</span>
                            )}
                          </div>

                          {/* Launch IDE Button */}
                          <div className="flex items-center gap-2">
                            {isUserHost && (
                              <button
                                onClick={() => setDeleteTarget({ id: r.id, name: r.name })}
                                className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 text-red-400 hover:text-red-200 border border-red-900/60 transition"
                                title="Delete Workspace (Host)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <Link
                              href={`/rooms/${r.id}`}
                              className="flex items-center gap-1 text-rose-400 group-hover:text-rose-300 font-bold transition-transform group-hover:translate-x-1 text-xs"
                            >
                              <span>Launch IDE</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 5 GITHUB MULTI-AGENT PARADIGMS SHOWCASE */}
        {activeDashboardTab === 'paradigms' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-rose-950/60 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                  <Bot className="h-5 w-5 text-amber-400" />
                  <span>5 Top GitHub Autonomous Paradigms Integrated</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Terintegrasi penuh di dalam setiap workspace IDE tanpa konfigurasi rumit
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs font-mono shadow-lg transition"
              >
                + Launch New Workspace
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Paradigm 1: ChatDev */}
              <div className="p-5 rounded-2xl bg-[#0e0614] border border-rose-950 hover:border-rose-600/60 transition space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                    ChatDev Paradigm
                  </span>
                  <span className="text-[10px] text-amber-400">Phase Waterfall</span>
                </div>
                <h3 className="text-sm font-bold text-white">Multi-Phase &amp; De-hallucination</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  5 fase otomatis: Requirements &rarr; Architecture &rarr; Coding &rarr; Testing &rarr; Release dengan safety-checkpoint agar agen tidak keluar jalur.
                </p>
                <div className="p-2.5 rounded-lg bg-[#07030a] border border-rose-950/50 text-[11px] text-rose-200">
                  ✓ Anti-hallucination threshold &bull; Step sanity validator
                </div>
              </div>

              {/* Paradigm 2: MetaGPT */}
              <div className="p-5 rounded-2xl bg-[#0e0614] border border-rose-950 hover:border-amber-600/60 transition space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                    MetaGPT Paradigm
                  </span>
                  <span className="text-[10px] text-emerald-400">SOP Engine</span>
                </div>
                <h3 className="text-sm font-bold text-white">Structured SOP &amp; PRD Generator</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Otomatis mengubah prompt user menjadi Product Requirements Document (PRD), diagram arsitektur Mermaid, dan API Contract terstandarisasi.
                </p>
                <div className="p-2.5 rounded-lg bg-[#07030a] border border-rose-950/50 text-[11px] text-amber-200">
                  ✓ 1-Click Save to VFS &bull; PRD, Architecture, OpenAPI Specs
                </div>
              </div>

              {/* Paradigm 3: Cline */}
              <div className="p-5 rounded-2xl bg-[#0e0614] border border-rose-950 hover:border-emerald-600/60 transition space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                    Cline Paradigm
                  </span>
                  <span className="text-[10px] text-rose-400">Human-In-Loop</span>
                </div>
                <h3 className="text-sm font-bold text-white">Human Approval &amp; Diff Review Gate</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sebelum agen menulis atau menimpa kode di file sistem, modal review diff interaktif muncul meminta persetujuan manusia.
                </p>
                <div className="p-2.5 rounded-lg bg-[#07030a] border border-rose-950/50 text-[11px] text-emerald-200">
                  ✓ Side-by-side diff review &bull; Reject with custom feedback
                </div>
              </div>

              {/* Paradigm 4: OpenHands */}
              <div className="p-5 rounded-2xl bg-[#0e0614] border border-rose-950 hover:border-cyan-600/60 transition space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                    OpenHands Paradigm
                  </span>
                  <span className="text-[10px] text-cyan-400">Thought Stream</span>
                </div>
                <h3 className="text-sm font-bold text-white">Agent Canvas &amp; Action Stream</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Melihat isi pikiran, penalaran internal, dan rantai keputusan agen langkah demi langkah saat menjalankan tugas terminal dan editing.
                </p>
                <div className="p-2.5 rounded-lg bg-[#07030a] border border-rose-950/50 text-[11px] text-cyan-200">
                  ✓ Step-by-step trajectory &bull; Live workspace canvas
                </div>
              </div>

              {/* Paradigm 5: Aider */}
              <div className="p-5 rounded-2xl bg-[#0e0614] border border-rose-950 hover:border-purple-600/60 transition space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                    Aider Paradigm
                  </span>
                  <span className="text-[10px] text-purple-400">Git Commits</span>
                </div>
                <h3 className="text-sm font-bold text-white">Atomic Commits &amp; Timeline</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Setiap perubahan yang dieksekusi agen dicatat dalam commit log virtual dengan SHA hash, pesan commit otomatis, dan file attribution.
                </p>
                <div className="p-2.5 rounded-lg bg-[#07030a] border border-rose-950/50 text-[11px] text-purple-200">
                  ✓ Virtual git log &bull; Instant rollback history
                </div>
              </div>

              {/* Card 6: Antigravity Core */}
              <div className="p-5 rounded-2xl bg-[#0e0614] border border-rose-950 hover:border-rose-500/60 transition space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                    Antigravity VFS
                  </span>
                  <span className="text-[10px] text-amber-400">Cloud IDE</span>
                </div>
                <h3 className="text-sm font-bold text-white">Monaco Editor &amp; Terminal</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  IDE kolaborasi real-time lengkap dengan multi-file directory tree, Monaco code editor, dan simulated bash command runner.
                </p>
                <div className="p-2.5 rounded-lg bg-[#07030a] border border-rose-950/50 text-[11px] text-rose-300">
                  ✓ In-Room Terminal &bull; Zero external server dependencies
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PHONK LOUNGE */}
        {activeDashboardTab === 'phonk' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-rose-950/60 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <Music className="h-5 w-5 text-rose-400" />
                <span>Viral Drift Phonk Radio</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Musik drift phonk TikTok viral dengan Memphis cowbell synth dan heavy sliding 808 sub-bass glides.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Phonk Player Widget */}
              <div className="lg:col-span-6 space-y-4">
                <PhonkRadioPlayer />
              </div>

              {/* Aesthetic Studio Showcase Card */}
              <div className="lg:col-span-6 rounded-2xl bg-[#0d0512] border border-rose-950 overflow-hidden shadow-2xl relative">
                <div className="h-64 sm:h-80 w-full relative overflow-hidden">
                  <img
                    src="/images/makima_bg.jpg"
                    alt="Cyber-Noir Studio Aesthetic"
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0512] via-[#0d0512]/40 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-rose-600/60 text-[11px] font-mono font-bold text-rose-300">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>ZATA Cyber Studio</span>
                  </div>
                </div>

                <div className="p-5 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-rose-400 font-bold uppercase tracking-wider">Soundtrack Engine</span>
                    <span>140 BPM Memphis Cowbell</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Sistem audio procedural Web Audio API kami mensintesis secara langsung metallic cowbell dan glide 808 bass tanpa buffering file eksternal yang lambat.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => soundManager.playJedagJedugBeat()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/30 transition hover:scale-105"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>Drop 808 Bass Beat</span>
                    </button>
                    <button
                      onClick={() => soundManager.playClick()}
                      className="px-3 py-2 rounded-xl bg-[#140819] border border-rose-950 text-slate-300 font-bold hover:text-white"
                    >
                      Test Mechanical Click
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. OFFICIAL ZATA COMMUNITY HUB & WHATSAPP SUPPORT FOOTER */}
      <CommunityFooter />

      {/* 3. MODALS */}
      {/* Create Room Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-[#0e0714] border border-rose-700/80 rounded-2xl shadow-2xl shadow-rose-950/80 p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-rose-950/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="h-5 w-5 text-rose-400" />
                <span>Initialize New Agentic Workspace</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Workspace / Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. distributed-cloud-architecture"
                  className="w-full px-3 py-2 rounded-xl bg-[#070309] border border-rose-950 text-white focus:outline-none focus:border-rose-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Core Objective / Prompt</label>
                <textarea
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Describe the architectural problem or code suite the agents must solve together in the VFS..."
                  className="w-full p-3 rounded-xl bg-[#070309] border border-rose-950 text-slate-200 focus:outline-none focus:border-rose-500 font-mono leading-relaxed"
                  required
                />
              </div>

              {/* Privacy Radio */}
              <div className="p-3 rounded-xl bg-[#070309] border border-rose-950 space-y-2">
                <div className="font-semibold text-slate-300">Access Mode</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                      isPublic
                        ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                        : 'bg-[#0e0714] border-slate-900 text-slate-500'
                    }`}
                  >
                    <Globe className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="font-bold text-xs">Public</div>
                      <div className="text-[10px] text-slate-400">Listed on Lobby</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                      !isPublic
                        ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                        : 'bg-[#0e0714] border-slate-900 text-slate-500'
                    }`}
                  >
                    <Lock className="h-4 w-4 text-amber-400" />
                    <div>
                      <div className="font-bold text-xs">Invite-Only</div>
                      <div className="text-[10px] text-slate-400">Passcode Protected</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Turn Delay (sec)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={turnDelaySec}
                    onChange={(e) => setTurnDelaySec(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#070309] border border-rose-950 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Turn Limit Cap</label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={maxTurns}
                    onChange={(e) => setMaxTurns(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#070309] border border-rose-950 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Initialize Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join with Passcode Modal */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-[#0e0714] border border-rose-700/80 rounded-2xl shadow-2xl p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-rose-950/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                <span>Join Workspace with Passcode</span>
              </h3>
              <button onClick={() => setIsJoinOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">8-Character Invite Code</label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="ZATA-XXXX"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070309] border border-rose-950 text-amber-400 font-mono text-center font-bold text-base tracking-widest focus:outline-none focus:border-amber-400"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-md shadow-amber-500/30 transition"
                >
                  Join Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Workspace Dialog */}
      {deleteTarget && (
        <DeleteRoomDialog
          roomId={deleteTarget.id}
          roomName={deleteTarget.name}
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            fetchRooms();
          }}
          isHost={true}
        />
      )}

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenGodMode={() => setIsGodModeOpen(true)}
      />

      {/* Developer Superuser Modal (Atha1337) */}
      <GodModeModal isOpen={isGodModeOpen} onClose={() => setIsGodModeOpen(false)} />
    </div>
  );
}

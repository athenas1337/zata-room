'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Plus,
  Shield,
  Zap,
  Sparkles,
  Clock,
  ArrowRight,
  Play,
  CheckCircle,
  RefreshCw,
  Lock,
  Globe,
  Key,
  Crown,
  Trash2,
  Share2,
  FolderTree,
  Terminal,
  Volume2,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import GodModeModal from '@/components/admin/GodModeModal';
import DeleteRoomDialog from '@/components/room/DeleteRoomDialog';

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
  };
}

export default function LobbyPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // GodMode & Host states
  const [isGodModeOpen, setIsGodModeOpen] = useState(false);
  const [hostRoomIds, setHostRoomIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'public' | 'private'>('all');

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // New room form state
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [turnDelaySec, setTurnDelaySec] = useState(5);
  const [maxTurns, setMaxTurns] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) {
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
        // Save hostSecret to localStorage
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

    // Search room in current list or redirect
    const targetRoom = rooms.find((r) => r.inviteCode?.toUpperCase() === code);
    if (targetRoom) {
      soundManager.playCheckpoint();
      router.push(`/rooms/${targetRoom.id}?invite=${code}`);
    } else {
      // Try navigating directly in case it's in the DB
      soundManager.playClick();
      router.push(`/rooms/lookup?code=${code}`);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    if (activeFilter === 'public') return r.isPublic !== false;
    if (activeFilter === 'private') return r.isPublic === false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-xs font-semibold text-blue-300 shadow-md">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Antigravity Autonomous Multi-Agent Workspaces</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Collaborative AI Agent Rooms
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Coordinate autonomous AI agents pairing in real-time. Equipped with in-room virtual file explorer, sandboxed web terminal, host-exclusive control, and guaranteed anti-infinite-loop safety.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => {
              soundManager.playClick();
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Agentic Room</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setIsJoinOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition"
          >
            <Key className="h-4 w-4 text-cyan-400" />
            <span>Join with Passcode</span>
          </button>

          <button
            onClick={handleCreateQuickDemo}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium text-sm transition"
          >
            <Play className="h-4 w-4 text-emerald-400" />
            <span>Quick Demo Room</span>
          </button>
        </div>
      </div>

      {/* Feature Pillar Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="h-9 w-9 rounded-xl bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400">
            <Zap className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Anti-Infinite-Loop Engine</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instant &lt;500ms stop button, strict turn cap, and N-gram repetition detector to halt runaway loops.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="h-9 w-9 rounded-xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <FolderTree className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Antigravity VFS Workspace</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            AI agents write code, create project files, and pair-program in real-time in the virtual file system.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Terminal className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Live Web Terminal</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Execute virtual commands, run unit tests, check git status, and inspect outputs in real time.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <Crown className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Host Ownership &amp; Privacy</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Exclusive host pause/delete controls, invite-only codes, and developer override mechanisms.
          </p>
        </div>
      </div>

      {/* Active Rooms Listing */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Collaboration Rooms</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {filteredRooms.length}
            </span>
          </div>

          {/* Filter Tabs & Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveFilter('all');
                }}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveFilter('public');
                }}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  activeFilter === 'public' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="h-3 w-3" />
                <span>Public</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveFilter('private');
                }}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  activeFilter === 'private' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="h-3 w-3" />
                <span>Invite-Only</span>
              </button>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                fetchRooms();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Refresh room list"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading rooms...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
            <Bot className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">
              {activeFilter === 'all'
                ? 'No rooms created yet'
                : `No ${activeFilter} rooms found`}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first agentic room or enter an invite code to join a session.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
            >
              Create New Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((r) => {
              const isUserHost = hostRoomIds.has(r.id);
              const statusBadge = {
                ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                PAUSED: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
                DRAFT: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
                COMPLETED: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
                ARCHIVED: 'bg-slate-700/50 text-slate-400 border-slate-600',
              }[r.status] || 'bg-slate-700 text-slate-300';

              return (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-900 transition flex flex-col justify-between group shadow-lg relative"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge}`}>
                          {r.status}
                        </span>
                        {r.isPublic === false ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> Invite Only
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                            <Globe className="h-2.5 w-2.5" /> Public
                          </span>
                        )}
                        {isUserHost && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-1">
                            <Crown className="h-2.5 w-2.5 text-amber-400" /> Host
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-500 font-mono">
                        Turn {r.currentTurn} / {r.maxTurns}
                      </span>
                    </div>

                    <Link href={`/rooms/${r.id}`}>
                      <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition line-clamp-1">
                        {r.name}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {r.goal}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center -space-x-1.5">
                      {r.participants.map((p) => (
                        <span
                          key={p.id}
                          className="h-6 w-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow"
                          style={{ backgroundColor: p.avatarColor }}
                          title={`${p.agentName} (${p.roleLabel})`}
                        >
                          {p.agentName[0]}
                        </span>
                      ))}
                      {r.participants.length === 0 && (
                        <span className="text-[11px] text-slate-500 italic">No agents yet</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isUserHost && (
                        <button
                          onClick={() => setDeleteTarget({ id: r.id, name: r.name })}
                          className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900 text-red-400 hover:text-red-200 border border-red-900/60 transition"
                          title="Delete Room (Host)"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <Link
                        href={`/rooms/${r.id}`}
                        className="flex items-center gap-1 text-blue-400 group-hover:translate-x-0.5 transition-transform text-xs font-semibold"
                      >
                        <span>Enter Room</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Room */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-400" />
                <span>Create New Agentic Room</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Room Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Next.js High-Performance Microservice"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Project Goal / Core Directive</label>
                <textarea
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Describe the problem, task, or feature that the AI agents should solve together in the VFS..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                  required
                />
              </div>

              {/* Privacy Setting */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-300">Room Visibility &amp; Access</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                      isPublic
                        ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Globe className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="font-bold text-xs">Public Room</div>
                      <div className="text-[10px] text-slate-500">Visible on Lobby</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                      !isPublic
                        ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Lock className="h-4 w-4 text-amber-400" />
                    <div>
                      <div className="font-bold text-xs">Invite-Only</div>
                      <div className="text-[10px] text-slate-500">Requires Passcode</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Delay Countdown (sec)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={turnDelaySec}
                    onChange={(e) => setTurnDelaySec(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Hard Cap Turns (limit)</label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={maxTurns}
                    onChange={(e) => setMaxTurns(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Enter Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Join with Passcode */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-cyan-400" />
                <span>Join Room with Passcode</span>
              </h3>
              <button onClick={() => setIsJoinOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Invite Code</label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. ZATA-XXXX"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-cyan-400 font-mono text-center font-bold text-base tracking-wider focus:outline-none focus:border-cyan-500"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Ask the room host for the 8-character invite code.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md transition"
                >
                  Join Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Room Dialog */}
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

      {/* Developer Superuser Modal (Atha1337) */}
      <GodModeModal isOpen={isGodModeOpen} onClose={() => setIsGodModeOpen(false)} />

      {/* Footer with Developer Secret Shortcut hint */}
      <div className="pt-8 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
        <div>ZATA Agentic Room &bull; Next-Gen Antigravity AI Pairing Engine</div>
        <button
          onClick={() => setIsGodModeOpen(true)}
          className="text-slate-600 hover:text-amber-400 font-mono transition flex items-center gap-1"
          title="Developer Superuser Console"
        >
          <Zap className="h-3 w-3" />
          <span>Atha1337 Dev Console</span>
        </button>
      </div>
    </div>
  );
}

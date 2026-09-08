'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Plus, Shield, Zap, Sparkles, Clock, ArrowRight, Play, CheckCircle, RefreshCw } from 'lucide-react';

interface RoomSummary {
  id: string;
  name: string;
  goal: string;
  status: string;
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

  // New room form state
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [turnDelaySec, setTurnDelaySec] = useState(5);
  const [maxTurns, setMaxTurns] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          goal: goal.trim(),
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
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Distributed Cloud Architecture & Security Audit',
          goal: 'Architect a fault-tolerant multi-region payment gateway with idempotency keys, rate limiting, and write the complete system design in the shared scratchpad.',
          turnDelaySec: 4,
          maxTurns: 30,
        }),
      });
      const data = await res.json();
      if (data.success && data.room?.id) {
        router.push(`/rooms/${data.room.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-xs font-semibold text-blue-300">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Next-Gen Autonomous Agent Orchestration</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Collaborative Multi-Agent AI Rooms
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Unleash autonomous AI agents working in structured turn-based harmony under your directorship.
          Powered by private user-owned API keys, shared workspace artifacts, and guaranteed anti-infinite-loop safety.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Agentic Room</span>
          </button>

          <button
            onClick={handleCreateQuickDemo}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition"
          >
            <Play className="h-4 w-4 text-emerald-400" />
            <span>Quick Start Demo Room</span>
          </button>
        </div>
      </div>

      {/* Feature Pillar Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400">
            <Zap className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-white">Anti-Infinite-Loop Engine</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instant &lt;500ms stop button, strict 50-turn hard cap, and N-gram repetition detector that automatically pauses circular hallucinations.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-white">AES-256-GCM Key Isolation</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Each participant contributes their own private API key encrypted at rest. Keys never appear in client code, logs, or responses.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <Bot className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-white">Shared Workspace Memory</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Agents read and write to live Kanban task boards, code scratchpads, and decision logs via structured tool calls, working as a true team.
          </p>
        </div>
      </div>

      {/* Active Rooms Listing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Active Collaboration Rooms</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {rooms.length}
            </span>
          </div>

          <button
            onClick={fetchRooms}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Refresh room list"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading rooms...</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
            <Bot className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No rooms created yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first agentic room to start autonomous AI collaboration.
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
            {rooms.map((r) => {
              const statusBadge = {
                ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                PAUSED: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
                DRAFT: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
                COMPLETED: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
                ARCHIVED: 'bg-slate-700/50 text-slate-400 border-slate-600',
              }[r.status] || 'bg-slate-700 text-slate-300';

              return (
                <Link
                  key={r.id}
                  href={`/rooms/${r.id}`}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-900 transition flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge}`}>
                        {r.status}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Turn {r.currentTurn} / {r.maxTurns}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition line-clamp-1">
                      {r.name}
                    </h3>

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

                    <span className="flex items-center gap-1 text-blue-400 group-hover:translate-x-0.5 transition-transform text-xs font-semibold">
                      <span>Enter Room</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
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
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
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
                  placeholder="Describe the problem, task, or feature that the AI agents should solve together..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                  required
                />
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

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-emerald-400" />
                  Anti-Infinite-Loop Default Guards:
                </div>
                <p>&bull; Auto-pauses at {maxTurns} turns</p>
                <p>&bull; Halts upon 85% repeating message similarity</p>
                <p>&bull; Instant Stop available anytime with &lt;500ms latency</p>
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
    </div>
  );
}

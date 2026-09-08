'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import {
  RoomDetailDTO,
  MessageDTO,
  WorkspaceItemDTO,
  SafetyEventDTO,
  ParticipantDTO,
  RoomStatus,
  SafetyConfig,
  VirtualFileDTO,
  TerminalLogDTO,
} from '@/types';
import SafetyControlBar from '@/components/room/SafetyControlBar';
import CountdownOverlay from '@/components/room/CountdownOverlay';
import AgentChatView from '@/components/room/AgentChatView';
import SharedWorkspace from '@/components/room/SharedWorkspace';
import RoleConfigModal from '@/components/room/RoleConfigModal';
import GodModeModal from '@/components/admin/GodModeModal';
import CommandPalette from '@/components/ide/CommandPalette';
import PhonkRadioPlayer from '@/components/brand/PhonkRadioPlayer';
import SwarmTopologySelector from '@/components/room/SwarmTopologySelector';
import CostSpeedometer from '@/components/room/CostSpeedometer';
import MultiplayerCursors from '@/components/room/MultiplayerCursors';
import ReactionOverlay from '@/components/room/ReactionOverlay';
import AgentMarketplaceModal, { MarketplaceAgent } from '@/components/room/AgentMarketplaceModal';
import {
  Bot,
  Plus,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Radio,
  Lock,
  ShieldCheck,
  Zap,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { soundManager } from '@/lib/sound';

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const router = useRouter();

  const [room, setRoom] = useState<RoomDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isGodModeOpen, setIsGodModeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);

  // Host & GodMode Status
  const [isHost, setIsHost] = useState(false);
  const [isGodMode, setIsGodMode] = useState(false);

  // Global Broadcast Banner
  const [globalBanner, setGlobalBanner] = useState<{ message: string; level: string; sender: string } | null>(null);

  // Real-time Virtual Files and Terminal Logs
  const [virtualFiles, setVirtualFiles] = useState<VirtualFileDTO[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogDTO[]>([]);

  // Real-time states
  const [thinkingAgent, setThinkingAgent] = useState<{
    agentName: string;
    roleLabel: string;
    avatarColor: string;
    turnNumber: number;
  } | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [countdownTotal, setCountdownTotal] = useState<number>(5);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isExecutingStepRef = useRef(false);

  // Check Host and GodMode permissions on client
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zata_host_secrets');
      if (stored) {
        const map = JSON.parse(stored);
        if (map[roomId]) {
          setIsHost(true);
        }
      }
      if (sessionStorage.getItem('zata_godmode_pass') === 'Atha1337') {
        setIsGodMode(true);
      }
    } catch (e) {
      // ignore
    }
  }, [roomId]);

  // Keyboard shortcut for Atha1337 Godmode: Ctrl + Shift + A & Command Palette: Ctrl + K
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

  // Fetch initial room data
  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rooms/${roomId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load room');
      setRoom(data.room);
      setCountdownTotal(data.room.turnDelaySec || 5);
      setVirtualFiles(data.room.virtualFiles || []);
      setTerminalLogs(data.room.terminalLogs || []);
    } catch (err: any) {
      setError(err.message || 'Error loading room data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [roomId]);

  // Connect to SSE Stream
  useEffect(() => {
    if (!roomId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      eventSource = new EventSource(`/api/rooms/${roomId}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleSSEMessage(payload);
        } catch (err) {
          // ignore heartbeat parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [roomId]);

  // Handle SSE Events
  const handleSSEMessage = (payload: any) => {
    const { type, data } = payload;

    switch (type) {
      case 'AGENT_THINKING':
        setThinkingAgent(data);
        soundManager.playTurnPing();
        break;

      case 'AGENT_MESSAGE':
        setThinkingAgent(null);
        soundManager.playClick();
        setRoom((prev) => {
          if (!prev) return prev;
          const exists = prev.messages.some((m) => m.id === data.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data],
          };
        });

        // Trigger turn countdown delay if room is active
        startDelayCountdown(room?.turnDelaySec || 5);
        break;

      case 'STATUS_UPDATE':
        if (data.deleted) {
          soundManager.playStop();
          alert('This room has been deleted.');
          router.push('/');
          return;
        }

        setRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status ?? prev.status,
            currentTurn: data.currentTurn ?? prev.currentTurn,
            totalTokens: data.totalTokens ?? prev.totalTokens,
            estimatedCost: data.estimatedCost ?? prev.estimatedCost,
            activeAgentIdx: data.activeAgentIdx ?? prev.activeAgentIdx,
          };
        });
        if (data.status === 'PAUSED' || data.status === 'COMPLETED') {
          clearDelayCountdown();
          soundManager.playStop();
        }
        break;

      case 'WORKSPACE_UPDATE':
        setRoom((prev) => {
          if (!prev) return prev;
          const items = [...prev.workspaceItems];
          const idx = items.findIndex((i) => i.key === data.key);
          if (idx >= 0) {
            items[idx] = data;
          } else {
            items.push(data);
          }
          return { ...prev, workspaceItems: items };
        });
        break;

      case 'SAFETY_EVENT':
        soundManager.playGlitchSound();
        setRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            safetyEvents: [data, ...prev.safetyEvents],
          };
        });
        break;

      case 'FILE_UPDATE':
        soundManager.playCheckpoint();
        setVirtualFiles((prev) => {
          if (data.deleted) {
            return prev.filter((f) => f.path !== data.path);
          }
          const idx = prev.findIndex((f) => f.path === data.path);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = data;
            return next;
          }
          return [...prev, data];
        });
        break;

      case 'TERMINAL_OUTPUT':
        soundManager.playClick();
        setTerminalLogs((prev) => [...prev, data]);
        break;

      case 'GLOBAL_BROADCAST':
        soundManager.playTurnPing();
        setGlobalBanner(data);
        setTimeout(() => setGlobalBanner(null), 8000);
        break;
    }
  };

  // Turn Step Loop Coordination
  const startDelayCountdown = (delaySec: number) => {
    clearDelayCountdown();
    setCountdownTotal(delaySec);
    setCountdownSeconds(delaySec);

    countdownTimerRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearDelayCountdown();
          triggerNextTurnStep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearDelayCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownSeconds(0);
  };

  const triggerNextTurnStep = async () => {
    if (isExecutingStepRef.current) return;
    isExecutingStepRef.current = true;

    try {
      const res = await fetch(`/api/rooms/${roomId}/step`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!data.success) {
        if (data.haltReason) {
          clearDelayCountdown();
        }
      }
    } catch (err) {
      console.error('Turn execution error:', err);
    } finally {
      isExecutingStepRef.current = false;
    }
  };

  const handleSkipDelay = () => {
    clearDelayCountdown();
    triggerNextTurnStep();
  };

  // Human Director actions
  const handleInstantStop = async () => {
    clearDelayCountdown();
    setThinkingAgent(null);
    try {
      let hostSecret = '';
      try {
        const stored = localStorage.getItem('zata_host_secrets');
        if (stored) {
          const map = JSON.parse(stored);
          hostSecret = map[roomId] || '';
        }
      } catch (e) {}

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (hostSecret) headers['x-host-secret'] = hostSecret;
      if (isGodMode) headers['x-godmode-pass'] = 'Atha1337';

      await fetch(`/api/rooms/${roomId}/stop`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Manual instant stop triggered by Host/Developer' }),
      });
      setRoom((prev) => (prev ? { ...prev, status: 'PAUSED' } : prev));
    } catch (err) {
      console.error('Error stopping room:', err);
    }
  };

  const handleResumeLoop = async () => {
    if (!room) return;
    if (room.participants.length < 2) {
      setIsRoleModalOpen(true);
      return;
    }

    try {
      await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      setRoom((prev) => (prev ? { ...prev, status: 'ACTIVE' } : prev));
      triggerNextTurnStep();
    } catch (err) {
      console.error('Error resuming room:', err);
    }
  };

  const handleSendDirectorMessage = async (content: string) => {
    // Secret backdoor trigger in director input: if Atha types 'Atha1337', open Godmode!
    if (content.trim() === 'Atha1337') {
      soundManager.playCheckpoint();
      setIsGodModeOpen(true);
      return;
    }

    try {
      await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } catch (err) {
      console.error('Error sending director message:', err);
    }
  };

  const handleUpdateConfig = async (
    newDelay: number,
    newMaxTurns: number,
    newConfig: Partial<SafetyConfig>
  ) => {
    try {
      await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnDelaySec: newDelay,
          maxTurns: newMaxTurns,
          safetyConfig: { ...room?.safetyConfig, ...newConfig },
        }),
      });
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              turnDelaySec: newDelay,
              maxTurns: newMaxTurns,
              safetyConfig: { ...prev.safetyConfig, ...newConfig } as any,
            }
          : prev
      );
    } catch (err) {
      console.error('Error updating config:', err);
    }
  };

  const handleSelectMarketplaceAgent = async (agent: MarketplaceAgent) => {
    try {
      await fetch(`/api/rooms/${roomId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent.name,
          roleLabel: agent.roleLabel,
          systemPrompt: agent.systemPrompt,
          provider: 'GEMINI',
          modelName: agent.recommendedModel,
          avatarColor: agent.avatarColor,
          isCustom: true,
        }),
      });
      fetchRoomData();
    } catch (e) {
      console.error('Failed to add marketplace agent', e);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="h-8 w-8 text-rose-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading Agentic Room session...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
        <h2 className="text-base font-bold text-white mb-1">Failed to load room</h2>
        <p className="text-xs text-slate-400 mb-4">{error || 'Room not found'}</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
        >
          Return to Lobby
        </Link>
      </div>
    );
  }

  const nextAgent =
    room.participants.length > 0
      ? room.participants[room.activeAgentIdx % room.participants.length]
      : null;

  return (
    <div className="flex-1 flex flex-col max-w-[1750px] w-full mx-auto pb-8 relative">
      {/* Real-time Simulated Collaborative Cursors (F61) */}
      <MultiplayerCursors participants={room.participants} />

      {/* Floating Spectator Reactions Overlay (F63) */}
      <ReactionOverlay />

      {/* Global Broadcast Banner */}
      {globalBanner && (
        <div
          className={`mx-4 mt-2 p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in slide-in-from-top duration-300 shadow-2xl ${
            globalBanner.level === 'critical'
              ? 'bg-red-950/90 border-red-700 text-red-200'
              : globalBanner.level === 'warning'
              ? 'bg-amber-950/90 border-amber-700 text-amber-200'
              : 'bg-blue-950/90 border-blue-700 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 animate-pulse shrink-0" />
            <span>
              <strong>[{globalBanner.sender}]:</strong> {globalBanner.message}
            </span>
          </div>
          <button onClick={() => setGlobalBanner(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Room Title Header */}
      <div className="px-4 py-3 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{room.name}</span>
              </h1>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  room.isPublic
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                    : 'bg-amber-950 text-amber-300 border border-amber-800/80'
                }`}
              >
                {room.isPublic ? 'Public' : 'Invite Only'}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">Goal: {room.goal}</p>
          </div>
        </div>

        {/* Header Right: Phonk Radio (F42), Participants & Developer Controls */}
        <div className="flex items-center gap-2">
          {/* Phonk Radio Player */}
          <PhonkRadioPlayer />

          {/* Developer Superuser Trigger (Ctrl+Shift+A) */}
          <button
            onClick={() => setIsGodModeOpen(true)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-500 hover:text-amber-400 text-[10px] font-mono transition"
            title="Developer Superuser Console (Ctrl+Shift+A)"
          >
            <Zap className="h-3.5 w-3.5" />
          </button>

          {/* Participants Badges + Add Agent */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Agents ({room.participants.length}/2+):</span>
            <div className="flex items-center -space-x-1.5">
              {room.participants.map((p) => (
                <span
                  key={p.id}
                  className="h-6 w-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow"
                  style={{ backgroundColor: p.avatarColor }}
                  title={`${p.agentName} (${p.roleLabel}) — ${p.provider} (${p.modelName}) [${p.keyMask}]`}
                >
                  {p.agentName[0]}
                </span>
              ))}
            </div>

            {/* Agent Marketplace Hub Button (F12) */}
            <button
              onClick={() => setIsMarketplaceOpen(true)}
              className="ml-1.5 p-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 transition"
              title="Browse Agent Marketplace (F12)"
            >
              <ShoppingBag className="h-3 w-3" />
            </button>

            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition shadow-sm"
            >
              <Plus className="h-3 w-3" />
              <span>Add Agent</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Safety Control Bar with Host/Guest Authorization */}
      <SafetyControlBar
        roomId={roomId}
        roomName={room.name}
        status={room.status}
        currentTurn={room.currentTurn}
        maxTurns={room.maxTurns}
        turnDelaySec={room.turnDelaySec}
        totalTokens={room.totalTokens}
        estimatedCost={room.estimatedCost}
        activeAgentName={nextAgent?.agentName}
        safetyConfig={room.safetyConfig}
        isProcessing={room.isProcessing}
        isHost={isHost}
        isGodMode={isGodMode}
        inviteCode={room.inviteCode || undefined}
        isPublic={room.isPublic}
        onStop={handleInstantStop}
        onResume={handleResumeLoop}
        onUpdateConfig={handleUpdateConfig}
        onRoomDeleted={() => router.push('/')}
      />

      {/* Live Burn-Rate Speedometer & Secret Sanitizer (F51 & F58) */}
      <div className="px-4 py-2">
        <CostSpeedometer
          totalTokens={room.totalTokens}
          estimatedCost={room.estimatedCost}
          currentTurn={room.currentTurn}
          maxTurns={room.maxTurns}
        />
      </div>

      {/* Swarm Topology Selector (F11) */}
      <div className="px-4 pb-2">
        <SwarmTopologySelector />
      </div>

      {/* Visual Delay Countdown Overlay */}
      {countdownSeconds > 0 && nextAgent && (
        <CountdownOverlay
          secondsLeft={countdownSeconds}
          totalSeconds={countdownTotal}
          nextAgentName={nextAgent.agentName}
          nextAgentAvatarColor={nextAgent.avatarColor}
          onSkipDelay={handleSkipDelay}
        />
      )}

      {/* Notice if Room has < 2 agents */}
      {room.participants.length < 2 && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Minimum 2 Agents Required to Collaborate</div>
              <p className="text-xs text-slate-300">
                Configure at least two AI agents (or import from Community Marketplace) to commence autonomous pairing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMarketplaceOpen(true)}
              className="px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 text-xs font-semibold shadow-md transition"
            >
              Open Marketplace
            </button>
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold whitespace-nowrap shadow-md transition"
            >
              Configure Agent #{room.participants.length + 1}
            </button>
          </div>
        </div>
      )}

      {/* Main Split Layout: Chat View (Left) & Antigravity VFS/Terminal Workspace (Right) */}
      <div className="flex-1 px-4 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
        {/* Left Column: Real-time Group Chat & Director Guidance (6 cols) */}
        <div className="lg:col-span-6 h-[760px]">
          <AgentChatView
            roomId={roomId}
            messages={room.messages}
            participants={room.participants}
            thinkingAgent={thinkingAgent}
            onSendDirectorMessage={handleSendDirectorMessage}
          />
        </div>

        {/* Right Column: Antigravity VFS + Terminal + Preview + Git + Whiteboard (6 cols) */}
        <div className="lg:col-span-6 h-[760px]">
          <SharedWorkspace
            roomId={roomId}
            roomName={room.name}
            workspaceItems={room.workspaceItems}
            safetyEvents={room.safetyEvents}
            virtualFiles={virtualFiles}
            terminalLogs={terminalLogs}
            isHost={isHost}
            onFilesUpdated={fetchRoomData}
            onTerminalExecuted={fetchRoomData}
          />
        </div>
      </div>

      {/* Role & Participant Modal */}
      <RoleConfigModal
        roomId={roomId}
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onParticipantAdded={fetchRoomData}
        existingCount={room.participants.length}
      />

      {/* Community Agent Marketplace Modal (F12) */}
      <AgentMarketplaceModal
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        onSelectAgent={handleSelectMarketplaceAgent}
      />

      {/* Developer GodMode Modal (Atha1337) */}
      <GodModeModal isOpen={isGodModeOpen} onClose={() => setIsGodModeOpen(false)} />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        files={virtualFiles}
        onSelectFile={(path) => {
          // File selected
        }}
        onRunTerminal={async (cmd) => {
          await fetch(`/api/rooms/${roomId}/terminal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: cmd, executedBy: 'Human Director (Palette)' }),
          });
          fetchRoomData();
        }}
        onInstantStop={handleInstantStop}
        onResume={handleResumeLoop}
        onOpenGodMode={() => setIsGodModeOpen(true)}
      />
    </div>
  );
}

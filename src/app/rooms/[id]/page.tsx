'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { RoomDetailDTO, MessageDTO, WorkspaceItemDTO, SafetyEventDTO, ParticipantDTO, RoomStatus, SafetyConfig } from '@/types';
import SafetyControlBar from '@/components/room/SafetyControlBar';
import CountdownOverlay from '@/components/room/CountdownOverlay';
import AgentChatView from '@/components/room/AgentChatView';
import SharedWorkspace from '@/components/room/SharedWorkspace';
import RoleConfigModal from '@/components/room/RoleConfigModal';
import { Bot, Plus, AlertTriangle, ArrowLeft, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);

  const [room, setRoom] = useState<RoomDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

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

  // Fetch initial room data
  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rooms/${roomId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load room');
      setRoom(data.room);
      setCountdownTotal(data.room.turnDelaySec || 5);
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
        // Reconnect after 3 seconds
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
        break;

      case 'AGENT_MESSAGE':
        setThinkingAgent(null);
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
        setRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            safetyEvents: [data, ...prev.safetyEvents],
          };
        });
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
          // Safety halt occurred
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
      await fetch(`/api/rooms/${roomId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual instant stop triggered by Human Director' }),
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
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
    <div className="flex-1 flex flex-col max-w-[1700px] w-full mx-auto pb-8">
      {/* Top Breadcrumb & Metadata Header */}
      <div className="px-4 py-3 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{room.name}</span>
            </h1>
            <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
              Goal: {room.goal}
            </p>
          </div>
        </div>

        {/* Participants Avatar Badges */}
        <div className="flex items-center gap-2">
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

            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-semibold transition"
            >
              <Plus className="h-3 w-3" />
              <span>Add Agent</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Anti-Infinite Loop Safety Control Bar */}
      <SafetyControlBar
        roomId={roomId}
        status={room.status}
        currentTurn={room.currentTurn}
        maxTurns={room.maxTurns}
        turnDelaySec={room.turnDelaySec}
        totalTokens={room.totalTokens}
        estimatedCost={room.estimatedCost}
        activeAgentName={nextAgent?.agentName}
        safetyConfig={room.safetyConfig}
        isProcessing={room.isProcessing}
        onStop={handleInstantStop}
        onResume={handleResumeLoop}
        onUpdateConfig={handleUpdateConfig}
      />

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
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Minimum 2 Agents Required to Collaborate</div>
              <p className="text-xs text-slate-300">
                Add at least two agents (each with their private API key) to begin autonomous turn-based collaboration.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap shadow-md transition"
          >
            Configure Agent #{room.participants.length + 1}
          </button>
        </div>
      )}

      {/* Main Split Layout: Chat View (Left) & Shared Workspace (Right) */}
      <div className="flex-1 px-4 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[580px]">
        {/* Left Column: Real-time Group Chat View (7 cols) */}
        <div className="lg:col-span-7 h-[680px]">
          <AgentChatView
            roomId={roomId}
            messages={room.messages}
            participants={room.participants}
            thinkingAgent={thinkingAgent}
            onSendDirectorMessage={handleSendDirectorMessage}
          />
        </div>

        {/* Right Column: Shared Workspace & Safety Log (5 cols) */}
        <div className="lg:col-span-5 h-[680px]">
          <SharedWorkspace
            roomId={roomId}
            workspaceItems={room.workspaceItems}
            safetyEvents={room.safetyEvents}
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
    </div>
  );
}

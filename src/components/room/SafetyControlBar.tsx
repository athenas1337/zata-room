'use client';

import React, { useState, useEffect } from 'react';
import { RoomStatus, SafetyConfig } from '@/types';
import {
  Square,
  Play,
  Pause,
  AlertTriangle,
  ShieldCheck,
  Zap,
  DollarSign,
  Sliders,
  CheckCircle,
  Volume2,
  VolumeX,
  Share2,
  Trash2,
  Crown,
  User,
  Lock,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import RoomInviteModal from './RoomInviteModal';
import DeleteRoomDialog from './DeleteRoomDialog';

interface SafetyControlBarProps {
  roomId: string;
  roomName: string;
  status: RoomStatus;
  currentTurn: number;
  maxTurns: number;
  turnDelaySec: number;
  totalTokens: number;
  estimatedCost: number;
  activeAgentName?: string;
  safetyConfig: SafetyConfig;
  isProcessing: boolean;
  isHost?: boolean;
  isGodMode?: boolean;
  inviteCode?: string | null;
  isPublic?: boolean;
  onStop: () => Promise<void>;
  onResume: () => Promise<void>;
  onUpdateConfig: (newDelay: number, newMaxTurns: number, newConfig: Partial<SafetyConfig>) => Promise<void>;
  onRoomDeleted?: () => void;
}

export default function SafetyControlBar({
  roomId,
  roomName,
  status,
  currentTurn,
  maxTurns,
  turnDelaySec,
  totalTokens,
  estimatedCost,
  activeAgentName,
  safetyConfig,
  isProcessing,
  isHost = false,
  isGodMode = false,
  inviteCode,
  isPublic = true,
  onStop,
  onResume,
  onUpdateConfig,
  onRoomDeleted,
}: SafetyControlBarProps) {
  const [isStopping, setIsStopping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hostWarning, setHostWarning] = useState<string | null>(null);

  const [delayInput, setDelayInput] = useState(turnDelaySec);
  const [maxTurnsInput, setMaxTurnsInput] = useState(maxTurns);
  const [repThreshold, setRepThreshold] = useState(safetyConfig?.repetitionThreshold ?? 0.85);

  const canControl = isHost || isGodMode;

  const warnNonHost = () => {
    soundManager.playStop();
    setHostWarning('Action restricted: Only the Room Host or Developer can control this room.');
    setTimeout(() => setHostWarning(null), 3500);
  };

  const handleStopClick = async () => {
    if (!canControl) {
      warnNonHost();
      return;
    }
    try {
      setIsStopping(true);
      soundManager.playStop();
      await onStop();
    } finally {
      setIsStopping(false);
    }
  };

  const handleResumeClick = async () => {
    if (!canControl) {
      warnNonHost();
      return;
    }
    soundManager.playCheckpoint();
    await onResume();
  };

  const handleToggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
    if (newState) soundManager.playTurnPing();
  };

  const handleSaveSettings = async () => {
    if (!canControl) {
      warnNonHost();
      return;
    }
    soundManager.playCheckpoint();
    await onUpdateConfig(delayInput, maxTurnsInput, { repetitionThreshold: repThreshold });
    setShowSettings(false);
  };

  const statusColor = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    PAUSED: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    DRAFT: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    COMPLETED: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    ARCHIVED: 'bg-slate-700/50 text-slate-400 border-slate-600',
  }[status] || 'bg-slate-700 text-slate-300';

  return (
    <>
      {/* Sticky Floating Safety Bar */}
      <div className="sticky top-16 z-40 w-full px-4 mb-3">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-700/70 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Status, Host Badge & Active Agent */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Host Privilege Indicator */}
            <div
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 border ${
                canControl
                  ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={canControl ? 'You have full host ownership and control of this room.' : 'You are participating as a Guest. Only the Host can stop or pause the agents.'}
            >
              {canControl ? (
                <>
                  <Crown className="h-3 w-3 text-amber-400" />
                  <span>{isGodMode ? '⚡ Developer Root' : '👑 Host (Owner)'}</span>
                </>
              ) : (
                <>
                  <User className="h-3 w-3 text-slate-400" />
                  <span>👤 Guest Spectator</span>
                </>
              )}
            </div>

            {/* Room Status Pill */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${statusColor} flex items-center gap-1.5`}>
              <span className={`h-2 w-2 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-400 animate-ping' : status === 'PAUSED' ? 'bg-amber-400' : 'bg-slate-400'}`} />
              {status}
            </span>

            {/* Turn Counter */}
            <div className="text-xs text-slate-300">
              <span className="text-slate-400">Turn:</span>{' '}
              <span className="font-bold text-white text-sm">{currentTurn}</span>
              <span className="text-slate-500"> / {maxTurns}</span>
            </div>

            {isProcessing && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2.5 py-0.5 rounded-md">
                <Zap className="h-3 w-3 animate-bounce" />
                <span>{activeAgentName ? `${activeAgentName} processing...` : 'Processing turn...'}</span>
              </div>
            )}
          </div>

          {/* Token & Cost Counter */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Anti-Loop ({Math.round((safetyConfig?.repetitionThreshold ?? 0.85) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-200 font-mono font-medium">{totalTokens.toLocaleString()}</span> tok
            </div>
            <div className="flex items-center gap-0.5 text-emerald-400 font-mono font-semibold">
              <DollarSign className="h-3 w-3" />
              <span>{estimatedCost.toFixed(4)}</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={soundEnabled ? 'Sound Effects Enabled (Turn Pings & Alerts)' : 'Sound Effects Muted'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Invite Button */}
            <button
              onClick={() => {
                setShowInviteModal(true);
                soundManager.playClick();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              title="Share Room & Invite Friends"
            >
              <Share2 className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">Invite</span>
            </button>

            {/* Settings Toggle */}
            <button
              onClick={() => {
                if (!canControl) {
                  warnNonHost();
                  return;
                }
                setShowSettings(!showSettings);
                soundManager.playClick();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title={canControl ? 'Safety & Delay Settings' : 'Settings (Host Only)'}
            >
              <Sliders className="h-4 w-4" />
            </button>

            {/* Resume / Start Button */}
            {status !== 'ACTIVE' ? (
              <button
                onClick={handleResumeClick}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>{status === 'DRAFT' ? 'Start' : 'Resume'}</span>
              </button>
            ) : (
              <button
                onClick={handleStopClick}
                disabled={isStopping}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-medium text-xs sm:text-sm transition"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
            )}

            {/* INSTANT STOP BUTTON (< 500ms) */}
            <button
              onClick={handleStopClick}
              disabled={isStopping}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/30 transition active:scale-95 disabled:opacity-50"
              title={canControl ? 'Instant Stop Backend Loop (<500ms)' : 'Instant Stop (Host Only)'}
            >
              <Square className="h-4 w-4 fill-white" />
              <span>{isStopping ? 'STOPPING...' : 'INSTANT STOP'}</span>
            </button>

            {/* Delete Room Button (Host / Godmode) */}
            {canControl && (
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  soundManager.playStop();
                }}
                className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900 border border-red-900/60 text-red-400 hover:text-red-200 transition"
                title="Delete Room Permanently"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Non-host warning notification */}
        {hostWarning && (
          <div className="max-w-7xl mx-auto mt-2 p-2.5 rounded-xl bg-amber-950 border border-amber-700 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in duration-200 shadow-lg">
            <Lock className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{hostWarning}</span>
          </div>
        )}

        {/* Safety Settings Drawer */}
        {showSettings && (
          <div className="max-w-7xl mx-auto mt-2 p-4 rounded-xl border border-slate-700 bg-slate-900/95 shadow-xl text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-blue-400" />
                Orchestration &amp; Safety System Controls
              </span>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Turn Delay Countdown (seconds)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={delayInput}
                    onChange={(e) => setDelayInput(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <span className="font-mono text-white font-bold w-8">{delayInput}s</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Countdown delay between alternating agent turns.</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Hard Cap Turn Limit</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={maxTurnsInput}
                  onChange={(e) => setMaxTurnsInput(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Strict hard cap: loop halts when turns reach this value.</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Repetition Detector Threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    value={repThreshold}
                    onChange={(e) => setRepThreshold(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <span className="font-mono text-white font-bold w-12">{Math.round(repThreshold * 100)}%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Pauses session if consecutive messages exceed similarity.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSettings}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Save Controls
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Collaborator Modal */}
      <RoomInviteModal
        roomId={roomId}
        roomName={roomName}
        inviteCode={inviteCode}
        isPublic={isPublic}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Delete Room Dialog */}
      <DeleteRoomDialog
        roomId={roomId}
        roomName={roomName}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={onRoomDeleted}
        isHost={isHost}
        isGodMode={isGodMode}
      />
    </>
  );
}

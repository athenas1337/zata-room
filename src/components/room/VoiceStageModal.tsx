'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  Users,
  Hand,
  Shield,
  Sparkles,
  X,
  Check,
  Headphones,
  Signal,
  Settings,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface StageParticipant {
  id: string;
  name: string;
  role: 'host' | 'speaker' | 'listener';
  isSpeaking: boolean;
  isMuted: boolean;
  hasHandRaised: boolean;
  avatarColor: string;
}

interface VoiceStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  isHost?: boolean;
}

export default function VoiceStageModal({
  isOpen,
  onClose,
  roomName,
  isHost = false,
}: VoiceStageModalProps) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [pingMs, setPingMs] = useState(18);

  const [participants, setParticipants] = useState<StageParticipant[]>([
    {
      id: 'p-1',
      name: isHost ? 'Atha (Host)' : 'Atha',
      role: isHost ? 'host' : 'speaker',
      isSpeaking: false,
      isMuted: true,
      hasHandRaised: false,
      avatarColor: '#e11d48',
    },
    {
      id: 'p-2',
      name: 'Makima (Neural Overseer)',
      role: 'speaker',
      isSpeaking: true,
      isMuted: false,
      hasHandRaised: false,
      avatarColor: '#f59e0b',
    },
    {
      id: 'p-3',
      name: 'Co-Admin Support',
      role: 'speaker',
      isSpeaking: false,
      isMuted: false,
      hasHandRaised: false,
      avatarColor: '#9333ea',
    },
    {
      id: 'p-4',
      name: 'Guest Developer #1',
      role: 'listener',
      isSpeaking: false,
      isMuted: true,
      hasHandRaised: true,
      avatarColor: '#0284c7',
    },
    {
      id: 'p-5',
      name: 'Guest Developer #2',
      role: 'listener',
      isSpeaking: false,
      isMuted: true,
      hasHandRaised: false,
      avatarColor: '#10b981',
    },
  ]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // 1. Microphone capture & Web Audio Analyser
  useEffect(() => {
    if (!isOpen || !isMicOn) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      setAudioLevel(0);
      return;
    }

    const startAudioCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        audioContextRef.current = ctx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));

          // Update self participant speaking state
          setParticipants((prev) =>
            prev.map((p) => (p.id === 'p-1' ? { ...p, isSpeaking: avg > 15 } : p))
          );

          animFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch (err) {
        console.warn('Microphone access denied or unavailable:', err);
        setIsMicOn(false);
      }
    };

    startAudioCapture();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, isMicOn]);

  // Simulated Makima speaking wave cycle
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === 'p-2' ? { ...p, isSpeaking: Math.random() > 0.4 } : p
        )
      );
      setPingMs(Math.floor(15 + Math.random() * 8));
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleMic = () => {
    soundManager.playClick();
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    setParticipants((prev) =>
      prev.map((p) => (p.id === 'p-1' ? { ...p, isMuted: !nextState } : p))
    );
  };

  const toggleHandRaise = () => {
    soundManager.playCheckpoint();
    setHasRaisedHand(!hasRaisedHand);
    setParticipants((prev) =>
      prev.map((p) => (p.id === 'p-1' ? { ...p, hasHandRaised: !hasRaisedHand } : p))
    );
  };

  const handlePromoteToSpeaker = (id: string) => {
    soundManager.playSuccess();
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, role: 'speaker', hasHandRaised: false } : p
      )
    );
  };

  const speakers = participants.filter((p) => p.role === 'host' || p.role === 'speaker');
  const listeners = participants.filter((p) => p.role === 'listener');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#0b0310] border-2 border-rose-950/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] font-mono text-xs">
        {/* Stage Header */}
        <div className="px-5 py-3.5 bg-[#130718] border-b border-rose-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-rose-950/80 border border-rose-600/60 flex items-center justify-center text-rose-400">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">
                  P2P Voice Stage &bull; {roomName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center gap-1">
                  <Signal className="h-2.5 w-2.5" />
                  {pingMs}ms P2P Mesh
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Low-latency Opus Audio &bull; Real-time Human &amp; AI Voice Stage
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#1a0822] hover:bg-rose-950 text-slate-400 hover:text-white border border-rose-950 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stage Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Speakers On Stage */}
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400 text-xs">
              <span className="font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Headphones className="h-3.5 w-3.5 text-rose-400" />
                <span>Speakers on Stage ({speakers.length})</span>
              </span>
              <span className="text-[10px] text-slate-500">Click avatar to interact</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {speakers.map((s) => {
                const isSelf = s.id === 'p-1';
                return (
                  <div
                    key={s.id}
                    className={`relative p-4 rounded-xl bg-[#120718] border transition duration-300 flex flex-col items-center justify-center text-center ${
                      s.isSpeaking
                        ? 'border-amber-500/80 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40'
                        : 'border-rose-950/70 hover:border-rose-800/60'
                    }`}
                  >
                    {/* Pulsing Audio Ring if Speaking */}
                    <div className="relative mb-2.5">
                      {s.isSpeaking && (
                        <div className="absolute -inset-2 rounded-full border-2 border-amber-400/80 animate-ping opacity-60" />
                      )}
                      <div
                        className="h-14 w-14 rounded-full border-2 border-slate-900 flex items-center justify-center text-base font-bold text-white shadow-xl relative"
                        style={{ backgroundColor: s.avatarColor }}
                      >
                        {s.name[0]}
                        {/* Mic Status Badge */}
                        <span
                          className={`absolute -bottom-1 -right-1 p-1 rounded-full border border-black text-[10px] ${
                            s.isMuted
                              ? 'bg-rose-950 text-rose-400'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {s.isMuted ? (
                            <MicOff className="h-2.5 w-2.5" />
                          ) : (
                            <Mic className="h-2.5 w-2.5" />
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="font-bold text-white text-xs line-clamp-1">{s.name}</div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">
                      {s.role === 'host' ? 'Stage Host' : 'Speaker'}
                    </span>

                    {/* Audio Level Bar for Self */}
                    {isSelf && isMicOn && (
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-75"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Audience / Listeners */}
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400 text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span>Audience &bull; Listeners ({listeners.length})</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {listeners.map((l) => (
                <div
                  key={l.id}
                  className="p-3 rounded-xl bg-[#0e0413] border border-rose-950/60 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-8 w-8 rounded-full border border-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: l.avatarColor }}
                    >
                      {l.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white text-xs font-semibold truncate">{l.name}</div>
                      <div className="text-[10px] text-slate-500">Listener</div>
                    </div>
                  </div>

                  {/* Hand raise badge / Host Promote action */}
                  {l.hasHandRaised && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="p-1 rounded bg-amber-950 text-amber-300 border border-amber-800/80 animate-bounce">
                        <Hand className="h-3 w-3" />
                      </span>
                      {isHost && (
                        <button
                          onClick={() => handlePromoteToSpeaker(l.id)}
                          className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                          title="Izinkan bicara di panggung"
                        >
                          Invite
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Bottom Control Bar */}
        <div className="px-5 py-3.5 bg-[#120718] border-t border-rose-950/80 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Device / Audio Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDeafened(!isDeafened)}
              className={`p-2 rounded-xl border transition ${
                isDeafened
                  ? 'bg-rose-950 text-rose-400 border-rose-800'
                  : 'bg-[#180920] text-slate-400 hover:text-white border-rose-950'
              }`}
              title={isDeafened ? 'Undeafen audio' : 'Deafen (Mute all)'}
            >
              {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <span className="text-[11px] text-slate-400">
              {isMicOn ? 'Live Transmitting' : 'Microphone Muted'}
            </span>
          </div>

          {/* Center / Right: Primary Actions */}
          <div className="flex items-center gap-2.5">
            {/* Raise Hand Button */}
            <button
              onClick={toggleHandRaise}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition ${
                hasRaisedHand
                  ? 'bg-amber-950 text-amber-300 border-amber-700 shadow-md shadow-amber-900/40'
                  : 'bg-[#180920] text-slate-300 hover:text-white border-rose-950'
              }`}
            >
              <Hand className="h-3.5 w-3.5" />
              <span>{hasRaisedHand ? 'Hand Raised' : 'Raise Hand'}</span>
            </button>

            {/* Mute / Unmute Main Button */}
            <button
              onClick={toggleMic}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition ${
                isMicOn
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow-emerald-900/40 ring-1 ring-emerald-400/50'
                  : 'bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-600 text-white shadow-rose-900/40'
              }`}
            >
              {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              <span>{isMicOn ? 'Mute Mic' : 'Unmute Mic'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Eye, Volume2, ShieldCheck, Heart } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface MakimaLiveAvatarProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
  onAvatarClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function MakimaLiveAvatar({
  isSpeaking = false,
  isThinking = false,
  onAvatarClick,
  size = 'md',
}: MakimaLiveAvatarProps) {
  // Eye tracking offset (normalized between -1 and 1)
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [dialogueQuote, setDialogueQuote] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Mouse coordinate tracking for concentric golden eyes
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);

      const maxRadius = 6.0; // Maximum pupil offset in SVG units
      const factor = Math.min(distance / 250, 1);

      const angle = Math.atan2(deltaY, deltaX);
      setEyeOffset({
        x: Math.cos(angle) * maxRadius * factor,
        y: Math.sin(angle) * maxRadius * factor,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 2. Procedural natural blinking (random 3-6s interval)
  useEffect(() => {
    const scheduleNextBlink = () => {
      const nextDelay = 2500 + Math.random() * 3500;
      blinkTimeoutRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 160);
      }, nextDelay);
    };

    scheduleNextBlink();
    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

  // 3. Lip-sync animation when Makima is speaking or generating tokens
  useEffect(() => {
    if (!isSpeaking && !isThinking) {
      setMouthPhase(0);
      return;
    }

    const interval = setInterval(() => {
      setMouthPhase((prev) => (prev + 1) % 4);
    }, 130);

    return () => clearInterval(interval);
  }, [isSpeaking, isThinking]);

  // Click voice quote
  const handleAvatarInteract = () => {
    soundManager.playJedagJedugBeat();
    const quotes = [
      'Semua kendali di ruang ZATA ini berada dalam pengawasanku.',
      'Tetaplah fokus, arsitektur terbaik lahir dari disiplin tinggi.',
      'Aku mengamatimu sayang. Lanjutkan karyamu dengan percaya diri.',
      'Tidak ada celah yang luput dari pandanganku.',
    ];
    const picked = quotes[Math.floor(Math.random() * quotes.length)];
    setDialogueQuote(picked);

    if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current);
    quoteTimeoutRef.current = setTimeout(() => setDialogueQuote(null), 4000);

    if (onAvatarClick) onAvatarClick();
  };

  const dimensions =
    size === 'sm'
      ? { width: 'w-24', height: 'h-24', svg: 120 }
      : size === 'lg'
      ? { width: 'w-64', height: 'h-64', svg: 240 }
      : { width: 'w-48', height: 'h-48', svg: 180 };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center select-none group cursor-pointer transition-transform duration-300 ${
        isHovered ? 'scale-105' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleAvatarInteract}
    >
      {/* Outer Atmospheric Aura Rings */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition duration-500 pointer-events-none ${
          isSpeaking
            ? 'bg-gradient-to-tr from-amber-500/40 via-rose-600/40 to-purple-600/40 animate-pulse'
            : isThinking
            ? 'bg-rose-600/30 animate-pulse'
            : 'bg-rose-950/20 group-hover:bg-amber-600/20'
        }`}
      />

      {/* SVG Canvas Portrait */}
      <div
        className={`relative ${dimensions.width} ${dimensions.height} rounded-2xl bg-gradient-to-b from-[#180a22] to-[#0a030f] border-2 border-rose-900/60 p-2 shadow-2xl flex items-center justify-center overflow-hidden`}
      >
        {/* Hypnotic Halo Behind Head */}
        <div
          className={`absolute inset-3 rounded-full border border-amber-500/20 pointer-events-none transition duration-700 ${
            isSpeaking ? 'rotate-180 scale-110 opacity-70' : 'opacity-30'
          }`}
          style={{ animation: 'spin 18s linear infinite' }}
        />

        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Skin Gradient */}
            <linearGradient id="makimaSkin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff2eb" />
              <stop offset="100%" stopColor="#f5ded5" />
            </linearGradient>

            {/* Hair Red Gradient */}
            <linearGradient id="makimaHair" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c54545" />
              <stop offset="60%" stopColor="#a32b2b" />
              <stop offset="100%" stopColor="#6e1414" />
            </linearGradient>

            {/* Golden Hypnotic Eye Gradient */}
            <radialGradient id="makimaEye" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe680" />
              <stop offset="40%" stopColor="#ffb833" />
              <stop offset="75%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </radialGradient>
          </defs>

          {/* Background Hair Volume */}
          <path
            d="M 50 140 C 35 180, 40 200, 45 210 L 155 210 C 160 200, 165 180, 150 140 Z"
            fill="url(#makimaHair)"
          />

          {/* Neck & Collared White Shirt */}
          <path d="M 85 140 L 115 140 L 120 185 L 80 185 Z" fill="#e8d5cc" />
          {/* Shirt Collar */}
          <path
            d="M 70 170 L 100 195 L 85 210 L 55 185 Z"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          <path
            d="M 130 170 L 100 195 L 115 210 L 145 185 Z"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          {/* Black Necktie */}
          <polygon points="96,190 104,190 106,210 94,210" fill="#1e1b2e" />

          {/* Face Base */}
          <path
            d="M 60 90 C 60 145, 80 162, 100 162 C 120 162, 140 145, 140 90 C 140 50, 120 40, 100 40 C 80 40, 60 50, 60 90 Z"
            fill="url(#makimaSkin)"
          />

          {/* Natural Blush */}
          <ellipse cx="73" cy="115" rx="7" ry="3.5" fill="#f43f5e" opacity="0.18" />
          <ellipse cx="127" cy="115" rx="7" ry="3.5" fill="#f43f5e" opacity="0.18" />

          {/* Nose */}
          <path
            d="M 100 110 L 98 122 L 102 122"
            stroke="#c89d8d"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Dynamic Mouth (Lip-sync morphing) */}
          {mouthPhase === 0 ? (
            // Closed polite smile
            <path
              d="M 92 138 Q 100 142 108 138"
              stroke="#be123c"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          ) : mouthPhase === 1 ? (
            // Slightly open talking
            <ellipse cx="100" cy="139" rx="5" ry="3" fill="#be123c" />
          ) : mouthPhase === 2 ? (
            // Wider articulation
            <ellipse cx="100" cy="140" rx="6" ry="4.5" fill="#881337" />
          ) : (
            // Gentle phonetic vowel
            <ellipse cx="100" cy="139" rx="4" ry="2.5" fill="#be123c" />
          )}

          {/* --- CONCENTRIC GOLDEN EYES (MAKIMA'S SIGNATURE) --- */}
          {/* Left Eye Sclera */}
          <g>
            <path
              d="M 68 98 Q 80 88 92 98 Q 80 108 68 98 Z"
              fill="#ffffff"
              stroke="#331010"
              strokeWidth="1.2"
            />
            {!isBlinking && (
              <g transform={`translate(${eyeOffset.x * 0.7}, ${eyeOffset.y * 0.7})`}>
                {/* Outer Iris */}
                <circle cx="80" cy="98" r="6.8" fill="url(#makimaEye)" />
                {/* Concentric Golden Ring 1 */}
                <circle
                  cx="80"
                  cy="98"
                  r="5.2"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="0.9"
                  opacity="0.9"
                />
                {/* Concentric Golden Ring 2 */}
                <circle
                  cx="80"
                  cy="98"
                  r="3.5"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="0.8"
                  opacity="0.95"
                />
                {/* Deep Pupil Ring */}
                <circle
                  cx="80"
                  cy="98"
                  r="1.8"
                  fill="none"
                  stroke="#78350f"
                  strokeWidth="0.8"
                />
                {/* Tiny Pinpoint Highlight */}
                <circle cx="78.5" cy="96.5" r="1.1" fill="#ffffff" />
              </g>
            )}
            {/* Eyelash & Crease */}
            <path
              d="M 66 96 Q 80 84 94 96"
              stroke="#2e0a0a"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
            {/* Eyelid closure when blinking */}
            {isBlinking && (
              <line
                x1="67"
                y1="98"
                x2="93"
                y2="98"
                stroke="#450a0a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
          </g>

          {/* Right Eye Sclera */}
          <g>
            <path
              d="M 108 98 Q 120 88 132 98 Q 120 108 108 98 Z"
              fill="#ffffff"
              stroke="#331010"
              strokeWidth="1.2"
            />
            {!isBlinking && (
              <g transform={`translate(${eyeOffset.x * 0.7}, ${eyeOffset.y * 0.7})`}>
                {/* Outer Iris */}
                <circle cx="120" cy="98" r="6.8" fill="url(#makimaEye)" />
                {/* Concentric Golden Ring 1 */}
                <circle
                  cx="120"
                  cy="98"
                  r="5.2"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="0.9"
                  opacity="0.9"
                />
                {/* Concentric Golden Ring 2 */}
                <circle
                  cx="120"
                  cy="98"
                  r="3.5"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="0.8"
                  opacity="0.95"
                />
                {/* Deep Pupil Ring */}
                <circle
                  cx="120"
                  cy="98"
                  r="1.8"
                  fill="none"
                  stroke="#78350f"
                  strokeWidth="0.8"
                />
                {/* Tiny Pinpoint Highlight */}
                <circle cx="118.5" cy="96.5" r="1.1" fill="#ffffff" />
              </g>
            )}
            {/* Eyelash & Crease */}
            <path
              d="M 106 96 Q 120 84 134 96"
              stroke="#2e0a0a"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
            {/* Eyelid closure when blinking */}
            {isBlinking && (
              <line
                x1="107"
                y1="98"
                x2="133"
                y2="98"
                stroke="#450a0a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
          </g>

          {/* Eyebrows */}
          <path
            d="M 68 85 Q 80 81 92 86"
            stroke="#831818"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 108 86 Q 120 81 132 85"
            stroke="#831818"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />

          {/* Front Hair Bangs (Iconic Makima Parting) */}
          <path
            d="M 55 80 C 55 45, 80 32, 100 32 C 120 32, 145 45, 145 80 C 145 90, 138 120, 135 130 C 132 110, 135 70, 128 65 C 120 60, 115 85, 110 105 C 108 95, 105 75, 100 68 C 95 75, 92 95, 90 105 C 85 85, 80 60, 72 65 C 65 70, 68 110, 65 130 C 62 120, 55 90, 55 80 Z"
            fill="url(#makimaHair)"
            stroke="#5c1010"
            strokeWidth="0.8"
          />
          {/* Side Strands (Long hair frame) */}
          <path
            d="M 60 100 C 52 135, 50 170, 52 195 C 55 170, 62 140, 65 120 Z"
            fill="url(#makimaHair)"
          />
          <path
            d="M 140 100 C 148 135, 150 170, 148 195 C 145 170, 138 140, 135 120 Z"
            fill="url(#makimaHair)"
          />
        </svg>

        {/* Status Mini-Badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-rose-900/50 text-[10px] text-amber-400 font-bold">
          <Eye className="h-2.5 w-2.5 text-amber-400 animate-pulse" />
          <span>{isSpeaking ? 'Speaking' : isThinking ? 'Synthesizing' : 'Tracking'}</span>
        </div>
      </div>

      {/* Floating Dialogue Speech Bubble on Click */}
      {dialogueQuote && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-60 p-2.5 rounded-xl bg-[#14061a]/95 border border-rose-800/80 shadow-2xl backdrop-blur-md text-[11px] text-slate-200 z-50 text-center animate-in fade-in zoom-in-95">
          <p className="italic font-medium">"{dialogueQuote}"</p>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#14061a] border-b border-r border-rose-800 rotate-45" />
        </div>
      )}

      <div className="mt-2 text-center">
        <span className="text-xs font-bold text-white tracking-wide block">Makima</span>
        <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
          <Sparkles className="h-2.5 w-2.5 text-amber-400" />
          <span>Neural Eye-Tracking &bull; Lip-Sync</span>
        </span>
      </div>
    </div>
  );
}

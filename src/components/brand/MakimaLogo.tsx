'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Radio } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface MakimaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  interactive?: boolean;
}

export default function MakimaLogo({
  size = 'md',
  showSubtitle = true,
  interactive = true,
}: MakimaLogoProps) {
  const [isJedagActive, setIsJedagActive] = useState(false);

  const handleLogoClick = () => {
    if (!interactive) return;
    setIsJedagActive((prev) => !prev);
    soundManager.playClick();
  };

  const avatarDimensions = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-14 w-14',
  }[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Makima Avatar with Jedag-Jedug Animated Ring */}
      <div
        onClick={handleLogoClick}
        className={`relative ${avatarDimensions} rounded-2xl cursor-pointer transition-transform active:scale-95 group ${
          isJedagActive ? 'animate-jedag-beat' : 'hover:scale-105'
        }`}
        title="Makima Jedag-Jedug Avatar (Click to pulse beat!)"
      >
        {/* Pulsing Outer Glow Aura */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-red-600 opacity-75 blur-sm group-hover:opacity-100 transition-opacity animate-pulse" />

        {/* Vector Canvas/SVG of Makima */}
        <div className="relative h-full w-full rounded-2xl overflow-hidden bg-[#0a050d] border border-rose-500/60 flex items-center justify-center shadow-lg">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Halo */}
            <circle cx="50" cy="50" r="46" fill="#140713" />
            <circle cx="50" cy="50" r="44" stroke="url(#makimaGradient)" strokeWidth="3" />
            <circle cx="50" cy="50" r="38" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

            {/* Suit & Collar */}
            <path d="M22 95 L50 68 L78 95 Z" fill="#0f0c14" />
            <path d="M35 80 L50 68 L65 80 L50 100 Z" fill="#f8fafc" />
            {/* Dark Tie */}
            <path d="M47 70 L53 70 L54 90 L50 96 L46 90 Z" fill="#9f1239" />

            {/* Neck & Face */}
            <path d="M43 60 L57 60 L54 70 L46 70 Z" fill="#fed7aa" />
            <path
              d="M32 44 Q50 68 68 44 Q68 28 50 24 Q32 28 32 44 Z"
              fill="#ffedd5"
            />

            {/* Makima's Crimson Rose Braided Hair Behind & Sides */}
            <path
              d="M26 36 C24 55 28 72 32 82 C34 76 35 60 36 48 Z"
              fill="#be123c"
            />
            <path
              d="M74 36 C76 55 72 72 68 82 C66 76 65 60 64 48 Z"
              fill="#9f1239"
            />
            <path
              d="M30 28 C40 18 60 18 70 28 C74 36 74 46 72 52 C68 35 60 30 50 30 C40 30 32 35 28 52 C26 46 26 36 30 28 Z"
              fill="#e11d48"
            />
            {/* Front Bangs */}
            <path d="M42 26 Q46 44 43 48 Q49 38 52 26 Z" fill="#f43f5e" />
            <path d="M50 26 Q54 44 57 48 Q52 38 50 26 Z" fill="#e11d48" />

            {/* Eyes - Concentric Hypnotic Spiral Rings (Makima's signature!) */}
            {/* Left Eye */}
            <g className="animate-eye-glow">
              <circle cx="42" cy="46" r="5" fill="#f59e0b" />
              <circle cx="42" cy="46" r="3.5" stroke="#78350f" strokeWidth="0.8" fill="#fbbf24" />
              <circle cx="42" cy="46" r="2" stroke="#b45309" strokeWidth="0.8" fill="#fef08a" />
              <circle cx="42" cy="46" r="0.9" fill="#451a03" />
              <circle cx="43" cy="44.8" r="0.6" fill="#ffffff" />
            </g>

            {/* Right Eye */}
            <g className="animate-eye-glow">
              <circle cx="58" cy="46" r="5" fill="#f59e0b" />
              <circle cx="58" cy="46" r="3.5" stroke="#78350f" strokeWidth="0.8" fill="#fbbf24" />
              <circle cx="58" cy="46" r="2" stroke="#b45309" strokeWidth="0.8" fill="#fef08a" />
              <circle cx="58" cy="46" r="0.9" fill="#451a03" />
              <circle cx="59" cy="44.8" r="0.6" fill="#ffffff" />
            </g>

            {/* Eyelashes & Brow */}
            <path d="M37 43 Q43 40 48 43" stroke="#881337" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M52 43 Q57 40 63 43" stroke="#881337" strokeWidth="1.2" strokeLinecap="round" />

            {/* Subtle Smile */}
            <path d="M47 56 Q50 58 53 56" stroke="#9f1239" strokeWidth="0.8" strokeLinecap="round" />

            {/* Gradients */}
            <defs>
              <linearGradient id="makimaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Small pulsing status dot */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border border-black" />
        </span>
      </div>

      {/* Brand Typography with ZATA COMMUNITY Badge */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-rose-100 to-rose-400 bg-clip-text text-transparent flex items-center gap-1.5">
            <span>ZATA</span>
            <span className="text-rose-500 drop-shadow-[0_0_12px_rgba(225,29,72,0.8)]">Agentic</span>
            <span className="text-slate-100">Room</span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-700/60 text-rose-300 font-bold uppercase tracking-wider shadow-sm">
            <Radio className="h-2.5 w-2.5 text-rose-400 animate-pulse" />
            Studio IDE
          </span>
        </div>

        {/* Dedicated requested "ZATA COMMUNITY" banner */}
        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 shadow-sm flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-amber-400" />
              ZATA COMMUNITY
            </span>
            <span className="text-[10px] text-slate-400 hidden md:inline">
              &bull; Makima Autonomous Swarm
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

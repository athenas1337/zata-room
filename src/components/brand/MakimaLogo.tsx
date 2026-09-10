'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, Radio } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface MakimaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  interactive?: boolean;
  onSecretTrigger?: () => void;
}

export default function MakimaLogo({
  size = 'md',
  showSubtitle = true,
  interactive = true,
  onSecretTrigger,
}: MakimaLogoProps) {
  const [isJedagActive, setIsJedagActive] = useState(false);
  const [isSuperJedag, setIsSuperJedag] = useState(false);

  // F44: Interactive eye-tracking coordinates
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const logoRef = useRef<HTMLDivElement>(null);

  // F50: Konami Code Easter Egg (Up Up Down Down Left Right Left Right B A)
  useEffect(() => {
    const konamiSequence = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ];
    let currentIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const expectedKey = konamiSequence[currentIndex];
      if (e.key.toLowerCase() === expectedKey.toLowerCase()) {
        currentIndex++;
        if (currentIndex === konamiSequence.length) {
          // Trigger Super Jedag-Jedug Mode!
          setIsSuperJedag(true);
          soundManager.playJedagJedugBeat();
          currentIndex = 0;
          setTimeout(() => setIsSuperJedag(false), 12000);
        }
      } else {
        currentIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // F44: Eye-Tracking Mouse Coordinates
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!logoRef.current) return;
      const rect = logoRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const distance = Math.min(2.5, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 80);

      setEyeOffset({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogoClick = () => {
    if (!interactive) return;
    setIsJedagActive((prev) => !prev);
    soundManager.playJedagJedugBeat();
  };

  const avatarDimensions = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-14 w-14',
  }[size];

  return (
    <div className="flex items-center gap-3 select-none" ref={logoRef}>
      {/* Makima Avatar with Jedag-Jedug Animated Ring */}
      <div
        onClick={handleLogoClick}
        className={`relative ${avatarDimensions} rounded-2xl cursor-pointer transition-transform active:scale-95 group ${
          isSuperJedag
            ? 'animate-bounce scale-110'
            : isJedagActive
            ? 'animate-jedag-beat'
            : 'hover:scale-105'
        }`}
        title="Makima Concentric Eye-Tracking Avatar (Click for Jedag beat!)"
      >
        {/* Pulsing Outer Glow Aura */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-red-600 opacity-75 blur-sm transition-opacity ${
            isSuperJedag ? 'opacity-100 blur-md animate-spin' : 'group-hover:opacity-100 animate-pulse'
          }`}
        />

        {/* Pinterest-style Makima High-Res Avatar with Jedag Glow */}
        <div className="relative h-full w-full rounded-2xl overflow-hidden bg-[#0a050d] border border-rose-500/60 flex items-center justify-center shadow-lg">
          <img
            src="/images/makima_avatar.jpg"
            alt="Makima ZATA Community"
            className="h-full w-full object-cover select-none transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              // Fallback to stylized SVG if image not yet loaded
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-rose-950/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Small status dot with subtle double-click handler */}
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 cursor-pointer"
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onSecretTrigger) onSecretTrigger();
          }}
        >
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

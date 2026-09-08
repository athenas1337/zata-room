'use client';

import React, { useState, useEffect } from 'react';
import { soundManager } from '@/lib/sound';

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number; // percentage from left
}

export default function ReactionOverlay() {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const EMOJIS = ['🩸', '🔥', '🚀', '🧠', '❤️', '⚡'];

  const triggerReaction = (emoji: string) => {
    soundManager.playClick();
    const newReaction: FloatingReaction = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      emoji,
      x: 75 + (Math.random() * 20 - 10), // group on bottom right
    };

    setReactions((prev) => [...prev, newReaction]);

    // Clean up after animation finishes (2.5s)
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2500);
  };

  return (
    <>
      {/* Floating Animated Reaction Sprites */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.x}%` }}
            className="absolute bottom-16 text-2xl select-none animate-float-up opacity-90 filter drop-shadow-md"
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Spectator Reactions Toolbar (Bottom Right Dock) */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#120718]/90 border border-rose-950/80 shadow-2xl backdrop-blur-md">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => triggerReaction(emoji)}
            className="h-8 w-8 rounded-xl hover:bg-rose-950/80 hover:scale-125 active:scale-95 transition flex items-center justify-center text-sm"
            title={`Send ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}

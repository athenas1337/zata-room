'use client';

import React, { useState, useEffect } from 'react';
import { ParticipantDTO } from '@/types';
import { MousePointer2 } from 'lucide-react';

interface MultiplayerCursorsProps {
  participants: ParticipantDTO[];
}

export default function MultiplayerCursors({ participants }: MultiplayerCursorsProps) {
  const [cursorPositions, setCursorPositions] = useState<
    Array<{ id: string; name: string; color: string; x: number; y: number }>
  >([]);

  useEffect(() => {
    // Generate simulated active cursors for participants
    const activePeers = participants.slice(0, 3).map((p, idx) => ({
      id: p.id,
      name: p.agentName,
      color: p.avatarColor || '#f43f5e',
      x: 35 + idx * 22,
      y: 40 + idx * 15,
    }));

    setCursorPositions(activePeers);

    // Subtle natural jitter / wander
    const interval = setInterval(() => {
      setCursorPositions((prev) =>
        prev.map((c) => ({
          ...c,
          x: Math.max(15, Math.min(85, c.x + (Math.random() * 4 - 2))),
          y: Math.max(20, Math.min(80, c.y + (Math.random() * 4 - 2))),
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [participants]);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none">
      {cursorPositions.map((cursor) => (
        <div
          key={cursor.id}
          style={{
            transform: `translate(${cursor.x}vw, ${cursor.y}vh)`,
            transition: 'transform 1.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          className="absolute flex items-start gap-1 text-[10px] font-mono font-bold"
        >
          <MousePointer2
            className="h-3.5 w-3.5 filter drop-shadow-md"
            style={{ color: cursor.color, fill: cursor.color }}
          />
          <span
            className="px-1.5 py-0.5 rounded shadow-lg text-white font-mono whitespace-nowrap text-[9px]"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </span>
        </div>
      ))}
    </div>
  );
}

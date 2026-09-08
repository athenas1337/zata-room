'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  Eraser,
  Square,
  Circle,
  Type,
  Download,
  Trash2,
  Undo2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface WhiteboardCanvasProps {
  roomId: string;
}

export default function WhiteboardCanvas({ roomId }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'rect' | 'circle'>('pen');
  const [color, setColor] = useState('#f43f5e'); // Rose crimson
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  const colors = ['#f43f5e', '#fbbf24', '#a855f7', '#38bdf8', '#10b981', '#ffffff'];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill dark obsidian background
    ctx.fillStyle = '#08030b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid dots
    ctx.fillStyle = '#22082b';
    for (let x = 20; x < canvas.width; x += 30) {
      for (let y = 20; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#08030b' : color;
    ctx.lineWidth = tool === 'eraser' ? 24 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'rect') {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
    } else if (tool === 'circle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      const radius = Math.hypot(x - startPos.x, y - startPos.y);
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    setStartPos(null);
  };

  // Stamp architectural node
  const handleAddStamp = (type: 'Agent Swarm' | 'Microservice' | 'PostgreSQL' | 'Redis') => {
    soundManager.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = Math.floor(Math.random() * (canvas.width - 200)) + 50;
    const y = Math.floor(Math.random() * (canvas.height - 100)) + 50;

    ctx.fillStyle = '#15071d';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, 140, 50, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`[ ${type} ]`, x + 70, y + 28);
  };

  const handleClear = () => {
    if (!confirm('Clear entire whiteboard canvas?')) return;
    soundManager.playStop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#08030b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleExportImage = () => {
    soundManager.playCheckpoint();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `architecture-diagram-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#08040a] font-mono text-xs select-none">
      {/* Whiteboard Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e0513] border-b border-rose-950/60 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-rose-400" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px] whitespace-nowrap">
            Architecture Canvas (F65)
          </span>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1 bg-[#140719] p-1 rounded-xl border border-rose-950">
          {[
            { id: 'pen', icon: PenTool, label: 'Pen' },
            { id: 'eraser', icon: Eraser, label: 'Eraser' },
            { id: 'rect', icon: Square, label: 'Box' },
            { id: 'circle', icon: Circle, label: 'Node' },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  soundManager.playClick();
                  setTool(t.id as any);
                }}
                className={`p-1.5 rounded-lg transition ${
                  isActive
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
                title={t.label}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                soundManager.playClick();
                setColor(c);
              }}
              className={`h-5 w-5 rounded-full border transition-transform ${
                color === c ? 'scale-125 border-white shadow-md' : 'border-black/50 hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Architecture Stamps */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleAddStamp('Agent Swarm')}
            className="px-2 py-1 rounded bg-[#17091e] border border-rose-950 hover:border-rose-700 text-rose-300 text-[10px] font-bold"
          >
            + Agent
          </button>
          <button
            onClick={() => handleAddStamp('PostgreSQL')}
            className="px-2 py-1 rounded bg-[#17091e] border border-rose-950 hover:border-rose-700 text-purple-300 text-[10px] font-bold"
          >
            + DB
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900/50 transition"
            title="Clear Canvas"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleExportImage}
            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow transition"
            title="Export Diagram PNG"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2 bg-[#040106]">
        <canvas
          ref={canvasRef}
          width={800}
          height={550}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="rounded-xl border border-rose-950/60 shadow-2xl cursor-crosshair max-w-full max-h-full"
        />
      </div>
    </div>
  );
}

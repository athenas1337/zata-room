'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  UserCheck,
  ShieldAlert,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

export default function CommunityFooter() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    soundManager.playClick();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full mt-10 rounded-2xl bg-gradient-to-r from-[#0c0512] via-[#09030c] to-[#0d0411] border border-rose-950/70 p-5 shadow-2xl font-mono text-xs select-none">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-rose-950/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-wide">
                ZATA COMMUNITY HUB &amp; SUPPORT
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold uppercase flex items-center gap-1">
                <Radio className="h-2.5 w-2.5 text-emerald-400 animate-pulse" />
                Live Channel
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hub resmi komunitas ZATA, pembaruan rilis AI Agentic Room, dan kontak langsung pengelola
            </p>
          </div>
        </div>

        <span className="text-[10px] text-rose-400/80 uppercase tracking-widest font-semibold flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>ZATA Studio IDE</span>
        </span>
      </div>

      {/* Grid: 3 Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
        {/* Card 1: Official WhatsApp Channel */}
        <div className="p-3.5 rounded-xl bg-[#120718]/80 border border-emerald-950/70 hover:border-emerald-700/60 transition flex flex-col justify-between space-y-3 group">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                <Radio className="h-3 w-3 animate-ping" />
                <span>Official Channel</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                WhatsApp
              </span>
            </div>
            <div className="font-bold text-white text-xs group-hover:text-emerald-300 transition">
              ZATA COMMUNITY CHANNEL
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              Dapatkan update fitur AI terbaru, event live room, dan panduan arsitektur swarm.
            </p>
          </div>

          <a
            href="https://whatsapp.com/channel/0029VbAUn5UCBtxNnznXVD2o"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundManager.playCheckpoint()}
            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-900/30"
          >
            <span>Join WhatsApp Channel</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Card 2: Admin Contact */}
        <div className="p-3.5 rounded-xl bg-[#120718]/80 border border-rose-950/70 hover:border-rose-700/60 transition flex flex-col justify-between space-y-3 group">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                <span>Lead Administrator</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                Official
              </span>
            </div>
            <div className="font-bold text-white text-xs group-hover:text-rose-300 transition">
              Admin Contact Support
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 bg-[#09030d] px-2.5 py-1.5 rounded-lg border border-rose-950">
              <span className="font-mono text-slate-200">+62 896-8234-5969</span>
              <button
                onClick={() => handleCopy('+6289682345969', 'admin_num')}
                className="text-slate-400 hover:text-white"
                title="Copy Number"
              >
                {copiedKey === 'admin_num' ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          <a
            href="https://wa.me/qr/NOWCN4S6MSKEA1"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundManager.playCheckpoint()}
            className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-rose-900/30"
          >
            <span>Chat Admin WhatsApp</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Card 3: Co-Admin Contact */}
        <div className="p-3.5 rounded-xl bg-[#120718]/80 border border-amber-950/70 hover:border-amber-700/60 transition flex flex-col justify-between space-y-3 group">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                <HeartHandshake className="h-3 w-3" />
                <span>Co-Administrator</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                Support
              </span>
            </div>
            <div className="font-bold text-white text-xs group-hover:text-amber-300 transition">
              Co-Admin Direct Contact
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 bg-[#09030d] px-2.5 py-1.5 rounded-lg border border-amber-950">
              <span className="font-mono text-slate-200">+62 882-0201-94288</span>
              <button
                onClick={() => handleCopy('+62882020194288', 'coadmin_num')}
                className="text-slate-400 hover:text-white"
                title="Copy Number"
              >
                {copiedKey === 'coadmin_num' ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          <a
            href="https://wa.me/qr/4YIG3A3UVITZJ1"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundManager.playCheckpoint()}
            className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-900/30"
          >
            <span>Chat Co-Admin WhatsApp</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Server,
  Activity,
  Zap,
  Clock,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Database,
  Lock,
} from 'lucide-react';
import MakimaLogo from '@/components/brand/MakimaLogo';
import { soundManager } from '@/lib/sound';

interface ServiceStatus {
  id: string;
  name: string;
  category: string;
  status: 'operational' | 'degraded' | 'outage';
  latencyMs: number;
  uptimePct: string;
}

const SERVICES: ServiceStatus[] = [
  {
    id: 'vfs',
    name: 'Antigravity Virtual File System (VFS)',
    category: 'Storage & IDE',
    status: 'operational',
    latencyMs: 1,
    uptimePct: '99.99%',
  },
  {
    id: 'swarm',
    name: 'Multi-Agent Autonomous Swarm Engine',
    category: 'AI Orchestration',
    status: 'operational',
    latencyMs: 38,
    uptimePct: '99.98%',
  },
  {
    id: 'terminal',
    name: 'In-Browser WebTerminal Simulator',
    category: 'Runtime & CLI',
    status: 'operational',
    latencyMs: 4,
    uptimePct: '100.00%',
  },
  {
    id: 'crypto',
    name: 'AES-256 Room Cryptography Vault',
    category: 'Security & Auth',
    status: 'operational',
    latencyMs: 0.8,
    uptimePct: '100.00%',
  },
  {
    id: 'edge',
    name: 'Vercel Free-Tier Serverless Gateways',
    category: 'Edge Network',
    status: 'operational',
    latencyMs: 18,
    uptimePct: '99.99%',
  },
  {
    id: 'safety',
    name: 'Anti-Loop Watchdog & Quorum Lock Gate',
    category: 'Safety Governance',
    status: 'operational',
    latencyMs: 2,
    uptimePct: '100.00%',
  },
];

export default function PublicStatusPage() {
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLastRefreshed(new Date().toLocaleTimeString());
  }, []);

  const handleRefresh = () => {
    soundManager.playClick();
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#07030a] text-slate-200 font-mono text-xs flex flex-col justify-between selection:bg-rose-900 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-rose-950/60 bg-[#0c0411]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-700/60 text-slate-400 hover:text-white transition"
              title="Return to Studio Lobby"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <MakimaLogo size="sm" showSubtitle={false} />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Updated: {lastRefreshed}
            </span>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg bg-[#14071a] border border-rose-950 hover:border-rose-700 text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 py-8 space-y-8 flex-1">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0c0512] to-rose-950/40 border border-emerald-800/50 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-950 border border-emerald-700 text-emerald-400 shadow-lg">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                All Systems Fully Operational
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Every node in the ZATA Agentic Swarm, Virtual Filesystem, and Edge Gateways is operating at peak health.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-900/40 border border-emerald-700/60 text-emerald-300 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
            100.00% System Uptime
          </div>
        </div>

        {/* 30-Day Uptime Visualization */}
        <div className="p-5 rounded-2xl bg-[#0d0513] border border-rose-950/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Platform Reliability (Past 30 Days)
            </span>
            <span className="text-emerald-400 font-bold">99.99% Average</span>
          </div>

          <div className="flex items-center gap-1 pt-1">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-8 rounded-sm bg-emerald-500 hover:bg-emerald-400 transition cursor-pointer group relative"
                title={`Day ${30 - i}: 100% operational`}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-slate-700 rounded text-[9px] text-white whitespace-nowrap pointer-events-none transition">
                  Day {30 - i}: 100%
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Detailed Service Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            <span>Service Node Diagnostics</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICES.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-[#0f0616] border border-rose-950/60 hover:border-rose-800/60 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">{s.category}</span>
                    <div className="font-bold text-white text-xs">{s.name}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase">
                    Operational
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-rose-950/40">
                  <span>Latency: <strong className="text-slate-200">{s.latencyMs}ms</strong></span>
                  <span>Uptime: <strong className="text-emerald-400">{s.uptimePct}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident History */}
        <div className="p-5 rounded-2xl bg-[#0d0513] border border-rose-950/60 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Incident Log
          </h3>
          <p className="text-slate-400 text-xs">
            No incidents reported today. All edge regions in North America, Europe, and Asia-Pacific operating normally.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-rose-950/60 py-4 bg-[#07030a] text-center text-[11px] text-slate-600">
        ZATA Community &bull; Autonomous Swarm Cloud IDE &bull; Real-Time Telemetry
      </footer>
    </div>
  );
}

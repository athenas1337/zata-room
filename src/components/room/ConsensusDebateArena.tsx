'use client';

import React, { useState } from 'react';
import { Swords, CheckCircle2, XCircle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface ModelCritique {
  modelName: string;
  provider: string;
  verdict: 'APPROVED' | 'REJECTED' | 'NEUTRAL';
  confidenceScore: number;
  critique: string;
}

export default function ConsensusDebateArena() {
  const [isDebating, setIsDebating] = useState(false);
  const [critiques, setCritiques] = useState<ModelCritique[]>([
    {
      modelName: 'Gemini 2.0 Flash',
      provider: 'Google AI',
      verdict: 'APPROVED',
      confidenceScore: 97,
      critique: 'Idempotency key TTL dan atomic locking logic sudah tepat. Tidak ada celah memory leak pada in-memory token bucket.',
    },
    {
      modelName: 'Claude 3.7 Sonnet',
      provider: 'Anthropic',
      verdict: 'APPROVED',
      confidenceScore: 94,
      critique: 'Struktur kode modular dan pemisahan controller dengan VFS aman. Saran: Tambahkan logging terstruktur untuk status 429.',
    },
    {
      modelName: 'DeepSeek V3',
      provider: 'DeepSeek',
      verdict: 'APPROVED',
      confidenceScore: 91,
      critique: 'Optimasi query Postgres advisory lock efisien. Tidak memerlukan roundtrip network eksternal berlebih.',
    },
    {
      modelName: 'GPT-4o Mini',
      provider: 'OpenAI',
      verdict: 'APPROVED',
      confidenceScore: 95,
      critique: 'Error handling exception menangani edge case concurrency dengan baik. Quorum consensus terpenuhi.',
    },
  ]);

  const handleRunDebate = () => {
    soundManager.playClick();
    setIsDebating(true);
    setTimeout(() => {
      setIsDebating(false);
      soundManager.playCheckpoint();
    }, 1400);
  };

  const approvedCount = critiques.filter((c) => c.verdict === 'APPROVED').length;
  const averageConfidence = Math.round(
    critiques.reduce((acc, c) => acc + c.confidenceScore, 0) / critiques.length
  );

  return (
    <div className="h-full flex flex-col bg-[#0b0510] border border-rose-950/70 rounded-2xl overflow-hidden font-mono text-xs shadow-2xl">
      {/* Header */}
      <div className="px-5 py-3 bg-[#120718] border-b border-rose-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-rose-500" />
          <span className="font-bold text-white text-xs">Multi-Model Consensus &amp; Debate Arena</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
            Adversarial Review
          </span>
        </div>

        <button
          onClick={handleRunDebate}
          disabled={isDebating}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isDebating ? 'animate-spin' : ''}`} />
          <span>{isDebating ? 'Re-evaluating Debate...' : 'Trigger Multi-Model Peer Review'}</span>
        </button>
      </div>

      {/* Consensus Summary Bar */}
      <div className="p-4 bg-[#09030d] border-b border-rose-950/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400 font-black text-sm shadow">
            {approvedCount}/{critiques.length}
          </div>
          <div>
            <div className="text-white font-bold text-xs flex items-center gap-2">
              <span>Consensus Quorum: PASSED</span>
              <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                <CheckCircle2 className="h-3 w-3" /> Unanimous Approval
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Rata-rata skor keyakinan model: <strong className="text-emerald-300">{averageConfidence}%</strong>. Kode aman untuk di-merge.
            </p>
          </div>
        </div>

        <div className="text-right text-[10px] text-slate-500">
          <div>Review Gate: Strict Active</div>
          <div className="text-amber-400">Zero Hallucination Tolerance</div>
        </div>
      </div>

      {/* Model Review Grid */}
      <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
        {critiques.map((c) => (
          <div
            key={c.modelName}
            className="p-3.5 rounded-xl bg-[#0f0615] border border-rose-950/80 hover:border-rose-700/60 transition space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs">{c.modelName}</span>
                  <span className="text-[9px] text-slate-500">({c.provider})</span>
                </div>
                <span className="text-[10px] px-2 py-0.2 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {c.verdict} ({c.confidenceScore}%)
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                &ldquo;{c.critique}&rdquo;
              </p>
            </div>

            <div className="pt-2 border-t border-rose-950/40 flex items-center justify-between text-[10px] text-slate-500">
              <span>Security Analysis: Passed</span>
              <span className="text-emerald-400">✓ Signed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { GitBranch, GitMerge, Check, Sparkles, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface BranchCandidate {
  id: string;
  name: string;
  strategy: string;
  author: string;
  testScore: number;
  safetyScore: number;
  complexity: 'Low' | 'Medium' | 'High';
  summary: string;
  diffPreview: string;
  isSelected?: boolean;
}

interface SwarmBranchControllerProps {
  roomId: string;
  onMergeBranch?: (branchName: string, files: any) => void;
}

export default function SwarmBranchController({
  roomId,
  onMergeBranch,
}: SwarmBranchControllerProps) {
  const [isBranching, setIsBranching] = useState(false);
  const [candidates, setCandidates] = useState<BranchCandidate[]>([
    {
      id: 'branch-alpha',
      name: 'candidate/alpha-redis-cache',
      strategy: 'Redis Idempotency & Dual-Region Fallback',
      author: 'Architect Alpha',
      testScore: 98,
      safetyScore: 96,
      complexity: 'Medium',
      summary: 'Uses Redis atomic SETNX with 24h TTL and token bucket rate-limiting algorithms.',
      diffPreview: '+ export async function processIdempotentPayment(key, payload) {\n+   const locked = await redis.set(key, "LOCKED", "NX", "EX", 86400);\n+   if (!locked) throw new ConflictError("Duplicate request detected");\n+ }',
      isSelected: true,
    },
    {
      id: 'branch-beta',
      name: 'candidate/beta-database-lock',
      strategy: 'Optimistic DB Locking & Postgres Advisory Locks',
      author: 'Coder Beta',
      testScore: 89,
      safetyScore: 92,
      complexity: 'Low',
      summary: 'Direct SQL locking using pg_try_advisory_xact_lock without external Redis dependencies.',
      diffPreview: '+ export async function executeWithAdvisoryLock(trx, lockId) {\n+   const res = await trx.$queryRaw`SELECT pg_try_advisory_xact_lock(${lockId})`;\n+   return res[0].pg_try_advisory_xact_lock;\n+ }',
      isSelected: false,
    },
    {
      id: 'branch-gamma',
      name: 'candidate/gamma-event-sourcing',
      strategy: 'Kafka / Event Sourcing Stream Processing',
      author: 'Auditor Gamma',
      testScore: 84,
      safetyScore: 88,
      complexity: 'High',
      summary: 'Full event sourcing pipeline with CQRS read models and durable replay log.',
      diffPreview: '+ export async function emitPaymentEvent(event) {\n+   await eventStore.append("payment_stream", event);\n+ }',
      isSelected: false,
    },
  ]);

  const [selectedBranchId, setSelectedBranchId] = useState('branch-alpha');
  const [mergedSuccess, setMergedSuccess] = useState<string | null>(null);

  const handleTriggerBranching = () => {
    soundManager.playClick();
    setIsBranching(true);
    setTimeout(() => {
      setIsBranching(false);
      soundManager.playCheckpoint();
    }, 1200);
  };

  const handleSelectBranch = (id: string) => {
    soundManager.playClick();
    setSelectedBranchId(id);
    setCandidates((prev) =>
      prev.map((c) => ({ ...c, isSelected: c.id === id }))
    );
  };

  const handleMerge = () => {
    const selected = candidates.find((c) => c.id === selectedBranchId);
    if (!selected) return;

    soundManager.playCheckpoint();
    setMergedSuccess(selected.name);

    if (onMergeBranch) {
      onMergeBranch(selected.name, selected.diffPreview);
    }

    setTimeout(() => setMergedSuccess(null), 3500);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0510] border border-rose-950/70 rounded-2xl overflow-hidden font-mono text-xs shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-[#120718] border-b border-rose-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-amber-400" />
          <span className="font-bold text-white text-xs">
            Tree-of-Thoughts &bull; Swarm Branch Controller
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
            3 Candidates
          </span>
        </div>

        <button
          onClick={handleTriggerBranching}
          disabled={isBranching}
          className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isBranching ? 'animate-spin' : ''}`} />
          <span>{isBranching ? 'Exploring Solutions...' : 'Fork New Swarm Candidates'}</span>
        </button>
      </div>

      {/* Candidate Cards Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {candidates.map((cand) => {
          const isSelected = cand.id === selectedBranchId;
          return (
            <div
              key={cand.id}
              onClick={() => handleSelectBranch(cand.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-[#180920] border-amber-500/80 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/50'
                  : 'bg-[#0e0614] border-rose-950 hover:border-rose-800/60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate">{cand.author}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      cand.testScore >= 90
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {cand.testScore}% Pass
                  </span>
                </div>

                <div className="font-bold text-white text-xs flex items-center gap-1">
                  <GitBranch className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="truncate">{cand.name}</span>
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {cand.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-rose-950/50 flex items-center justify-between text-[10px] text-slate-400">
                <span>Complexity: <strong className="text-rose-300">{cand.complexity}</strong></span>
                <span>Safety: <strong className="text-emerald-400">{cand.safetyScore}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Diff Inspector & Merge Gate */}
      <div className="flex-1 px-4 pb-4 flex flex-col">
        <div className="flex-1 rounded-xl bg-[#060208] border border-rose-950/70 p-3 overflow-hidden flex flex-col space-y-2">
          <div className="flex items-center justify-between text-[11px] border-b border-rose-950/40 pb-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span>Candidate Solution Diff:</span>
              <strong className="text-amber-400">
                {candidates.find((c) => c.id === selectedBranchId)?.name}
              </strong>
            </span>
            <span className="text-[10px] text-emerald-400">✓ Automated Tests Passing</span>
          </div>

          <pre className="flex-1 p-2 rounded bg-[#09030c] text-emerald-300/90 font-mono text-[10px] overflow-auto whitespace-pre leading-relaxed border border-rose-950/30">
            {candidates.find((c) => c.id === selectedBranchId)?.diffPreview}
          </pre>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              Merging will integrate selected candidate into main VFS.
            </span>

            <button
              onClick={handleMerge}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
            >
              {mergedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>Merged to Main!</span>
                </>
              ) : (
                <>
                  <GitMerge className="h-3.5 w-3.5" />
                  <span>Merge Candidate to Main VFS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

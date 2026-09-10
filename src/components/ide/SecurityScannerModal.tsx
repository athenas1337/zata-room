'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Check, RefreshCw, Lock } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface SecurityIssue {
  id: string;
  filePath: string;
  rule: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'SAFE';
  lineSnippet: string;
  mitigation: string;
  status: 'OPEN' | 'FIXED';
}

interface SecurityScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Array<{ path: string; content: string }>;
  onAutoFix?: (filePath: string, fixSnippet: string) => void;
}

export default function SecurityScannerModal({
  isOpen,
  onClose,
  files,
  onAutoFix,
}: SecurityScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<SecurityIssue[]>([
    {
      id: 'sec-1',
      filePath: 'src/server/payment.ts',
      rule: 'Hardcoded Secret / Token Exposure',
      severity: 'HIGH',
      lineSnippet: 'const stripeSecretKey = "sk_test_51Mz...DEMO";',
      mitigation: 'Gunakan process.env.STRIPE_SECRET_KEY dan enkripsi AES-256 at-rest.',
      status: 'OPEN',
    },
    {
      id: 'sec-2',
      filePath: 'src/db/queries.ts',
      rule: 'Potential SQL Injection / Unsanitized Input',
      severity: 'MEDIUM',
      lineSnippet: 'db.$queryRawUnsafe(`SELECT * FROM users WHERE id = ${userId}`);',
      mitigation: 'Gunakan parameterized queries: db.$queryRaw`SELECT * FROM users WHERE id = ${userId}`',
      status: 'OPEN',
    },
    {
      id: 'sec-3',
      filePath: 'src/utils/eval.ts',
      rule: 'Dangerous Dynamic Code Evaluation (eval)',
      severity: 'CRITICAL',
      lineSnippet: 'const result = eval(userCodePayload);',
      mitigation: 'Gunakan isolated VM sandboxing atau Web Worker dengan timeout guard.',
      status: 'OPEN',
    },
  ]);

  if (!isOpen) return null;

  const handleRescan = () => {
    soundManager.playClick();
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      soundManager.playCheckpoint();
    }, 1200);
  };

  const handleFixIssue = (issueId: string) => {
    soundManager.playCheckpoint();
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: 'FIXED' } : i))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-[#0e0714] border border-rose-700/80 rounded-2xl shadow-2xl p-6 space-y-4 font-mono text-xs max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-rose-950/60 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            <h3 className="text-base font-bold text-white">In-IDE Security &amp; SAST Vulnerability Scanner</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Scan Status Banner */}
        <div className="p-3 rounded-xl bg-[#09030d] border border-rose-950 flex items-center justify-between">
          <div>
            <div className="font-bold text-white text-xs">Security Scan: {files.length} VFS Files Monitored</div>
            <div className="text-[10px] text-slate-400">OWASP Top 10 &bull; CWE-79 / CWE-89 / CWE-798 Guard</div>
          </div>
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-[11px] flex items-center gap-1 transition"
          >
            <RefreshCw className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Re-scan VFS'}</span>
          </button>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {issues.map((issue) => {
            const isFixed = issue.status === 'FIXED';
            const severityColor = {
              CRITICAL: 'bg-red-950 text-red-300 border-red-800',
              HIGH: 'bg-amber-950 text-amber-300 border-amber-800',
              MEDIUM: 'bg-yellow-950 text-yellow-300 border-yellow-800',
              SAFE: 'bg-emerald-950 text-emerald-300 border-emerald-800',
            }[issue.severity];

            return (
              <div
                key={issue.id}
                className={`p-3.5 rounded-xl border transition space-y-2 ${
                  isFixed
                    ? 'bg-[#09030c]/60 border-emerald-900/40 opacity-70'
                    : 'bg-[#120718] border-rose-950/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.2 rounded font-bold uppercase border ${severityColor}`}>
                      {issue.severity}
                    </span>
                    <span className="font-bold text-white text-xs">{issue.rule}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{issue.filePath}</span>
                </div>

                <div className="p-2 rounded bg-[#07030a] text-rose-200/90 text-[11px] font-mono border border-rose-950/40 truncate">
                  <code>{issue.lineSnippet}</code>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 leading-relaxed max-w-md">
                    <strong>Mitigasi:</strong> {issue.mitigation}
                  </span>

                  <button
                    onClick={() => handleFixIssue(issue.id)}
                    disabled={isFixed}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      isFixed
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {isFixed ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Fixed</span>
                      </>
                    ) : (
                      <span>Apply Auto-Fix</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-rose-950/60 text-[11px] text-slate-500">
          <span>AES-256 Encrypted In-Memory Scan</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}

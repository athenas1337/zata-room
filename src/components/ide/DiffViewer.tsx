'use client';

import React from 'react';
import { GitCompare, X, Plus, Minus } from 'lucide-react';

interface DiffViewerProps {
  fileName: string;
  originalContent: string;
  modifiedContent: string;
  onClose: () => void;
}

export default function DiffViewer({
  fileName,
  originalContent,
  modifiedContent,
  onClose,
}: DiffViewerProps) {
  const origLines = (originalContent || '').split('\n');
  const modLines = (modifiedContent || '').split('\n');

  // Simple line-based unified diff calculator
  const diffItems: Array<{ type: 'same' | 'add' | 'remove'; text: string; lineNo?: number }> = [];

  const maxLen = Math.max(origLines.length, modLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const m = modLines[i];

    if (o === m && o !== undefined) {
      diffItems.push({ type: 'same', text: o, lineNo: i + 1 });
    } else {
      if (o !== undefined) {
        diffItems.push({ type: 'remove', text: o, lineNo: i + 1 });
      }
      if (m !== undefined) {
        diffItems.push({ type: 'add', text: m, lineNo: i + 1 });
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a050d] border border-rose-950/60 rounded-xl overflow-hidden font-mono text-xs shadow-2xl">
      {/* Diff Header */}
      <div className="px-4 py-2 bg-[#120718] border-b border-rose-950/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-rose-400" />
          <span className="font-bold text-white text-xs">Visual Diff &bull; {fileName}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 font-bold border border-rose-800/60">
            HEAD vs Agent Working Copy
          </span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Unified Diff Lines */}
      <div className="flex-1 overflow-auto p-2 space-y-0.5">
        {diffItems.map((item, idx) => {
          if (item.type === 'add') {
            return (
              <div
                key={idx}
                className="flex items-start bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500 px-2 py-0.5 text-[11px] leading-tight"
              >
                <span className="text-emerald-500 select-none w-5 shrink-0">+</span>
                <pre className="whitespace-pre overflow-x-auto font-mono flex-1">{item.text}</pre>
              </div>
            );
          }
          if (item.type === 'remove') {
            return (
              <div
                key={idx}
                className="flex items-start bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 px-2 py-0.5 text-[11px] leading-tight"
              >
                <span className="text-rose-500 select-none w-5 shrink-0">-</span>
                <pre className="whitespace-pre overflow-x-auto font-mono flex-1 line-through opacity-80">
                  {item.text}
                </pre>
              </div>
            );
          }
          return (
            <div
              key={idx}
              className="flex items-start text-slate-400 px-2 py-0.5 text-[11px] leading-tight hover:bg-slate-900/40"
            >
              <span className="text-slate-600 select-none w-5 shrink-0">{item.lineNo}</span>
              <pre className="whitespace-pre overflow-x-auto font-mono flex-1">{item.text}</pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}

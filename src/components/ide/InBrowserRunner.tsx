'use client';

import React, { useState } from 'react';
import { Play, RotateCcw, Terminal, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface InBrowserRunnerProps {
  initialCode?: string;
  files?: Array<{ path: string; content: string }>;
}

export default function InBrowserRunner({
  initialCode,
  files = [],
}: InBrowserRunnerProps) {
  const defaultCode =
    initialCode ||
    `// In-Browser Sandboxed Script Runner
// Execute logic safely inside the client-side sandbox

function simulateRateLimiter(requestsPerMinute) {
  const bucket = { tokens: requestsPerMinute, lastRefill: Date.now() };
  console.log("Initializing Token Bucket Rate Limiter with cap:", requestsPerMinute);
  
  for (let i = 1; i <= 5; i++) {
    if (bucket.tokens > 0) {
      bucket.tokens--;
      console.log(\`Request #\${i}: ALLOWED (Tokens left: \${bucket.tokens})\`);
    } else {
      console.warn(\`Request #\${i}: THROTTLED (429 Too Many Requests)\`);
    }
  }
  return { status: "success", remainingTokens: bucket.tokens };
}

simulateRateLimiter(3);`;

  const [code, setCode] = useState(defaultCode);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleRun = () => {
    soundManager.playClick();
    setIsRunning(true);
    setHasError(false);
    setOutputLogs([]);

    const capturedLogs: string[] = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      capturedLogs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      originalLog(...args);
    };

    console.warn = (...args: any[]) => {
      capturedLogs.push('[WARN] ' + args.map((a) => String(a)).join(' '));
      originalWarn(...args);
    };

    console.error = (...args: any[]) => {
      capturedLogs.push('[ERROR] ' + args.map((a) => String(a)).join(' '));
      originalError(...args);
    };

    const startTime = performance.now();

    try {
      // Safe function execution in browser context
      const runFn = new Function(code);
      const result = runFn();

      if (result !== undefined) {
        capturedLogs.push('\n[Return Value]: ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)));
      }
      soundManager.playCheckpoint();
    } catch (err: any) {
      setHasError(true);
      capturedLogs.push(`[Runtime Exception]: ${err.message}`);
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;

      const duration = performance.now() - startTime;
      setExecutionTimeMs(Math.round(duration * 100) / 100);
      setOutputLogs(capturedLogs);
      setIsRunning(false);
    }
  };

  const handleLoadFromFile = (filePath: string) => {
    const target = files.find((f) => f.path === filePath);
    if (target) {
      setCode(target.content);
      soundManager.playClick();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0510] border border-rose-950/70 rounded-2xl overflow-hidden font-mono text-xs shadow-2xl">
      {/* Runner Header */}
      <div className="px-4 py-2.5 bg-[#120718] border-b border-rose-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-white text-xs">In-Browser Sandboxed Script Runner</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
            Client VM
          </span>
        </div>

        <div className="flex items-center gap-2">
          {files.length > 0 && (
            <select
              onChange={(e) => handleLoadFromFile(e.target.value)}
              className="px-2 py-1 rounded-lg bg-[#07030a] border border-rose-950 text-slate-300 text-[10px] focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>Load from VFS...</option>
              {files.map((f) => (
                <option key={f.path} value={f.path}>{f.path}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setCode(defaultCode)}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Reset code"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow transition disabled:opacity-50"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>{isRunning ? 'Running...' : 'Execute'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Console Split */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-rose-950/60 overflow-hidden">
        {/* Code Input */}
        <div className="flex flex-col h-full bg-[#07030a]">
          <div className="px-3 py-1.5 bg-[#0e0614] border-b border-rose-950/40 text-[10px] text-slate-400 flex items-center justify-between">
            <span>JavaScript / TypeScript Source</span>
            <span className="text-slate-500">Live Execution</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 p-3 bg-transparent text-rose-100 font-mono text-[11px] leading-relaxed resize-none focus:outline-none selection:bg-rose-600 selection:text-white"
            spellCheck={false}
          />
        </div>

        {/* Execution Output */}
        <div className="flex flex-col h-full bg-[#060208]">
          <div className="px-3 py-1.5 bg-[#0e0614] border-b border-rose-950/40 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400" /> Output Stream
            </span>
            {executionTimeMs !== null && (
              <span className={`text-[10px] font-bold ${hasError ? 'text-red-400' : 'text-emerald-400'}`}>
                {hasError ? 'Execution Failed' : `Finished in ${executionTimeMs}ms`}
              </span>
            )}
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-1 text-[11px] font-mono">
            {outputLogs.length === 0 ? (
              <div className="text-slate-600 italic text-[11px] p-4 text-center">
                Tekan tombol &quot;Execute&quot; untuk menjalankan skrip di dalam browser sandbox...
              </div>
            ) : (
              outputLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`whitespace-pre-wrap leading-relaxed ${
                    log.includes('[ERROR]') || log.includes('[Runtime Exception]')
                      ? 'text-red-400'
                      : log.includes('[WARN]')
                      ? 'text-amber-400'
                      : log.includes('[Return Value]')
                      ? 'text-emerald-300 font-bold border-t border-rose-950/40 pt-1'
                      : 'text-rose-200/90'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

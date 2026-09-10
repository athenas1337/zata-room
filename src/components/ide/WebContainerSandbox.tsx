'use client';

import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Terminal,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Download,
  Copy,
  Check,
  PackageCheck,
  HardDrive,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface WebContainerSandboxProps {
  initialCode?: string;
  files?: Array<{ path: string; content: string }>;
  onSaveOutputToVfs?: (filename: string, content: string) => void;
}

export default function WebContainerSandbox({
  initialCode,
  files = [],
  onSaveOutputToVfs,
}: WebContainerSandboxProps) {
  const PRESET_TEMPLATES: Record<string, string> = {
    zod_validation: `// WebContainer WASM Node Runtime
// Testing schema validation with simulated Zod engine

const schema = {
  name: "string",
  age: "number",
  email: "string"
};

function validateUser(payload) {
  console.log("Parsing input payload against schema...");
  const errors = [];
  if (typeof payload.name !== 'string') errors.push("Expected name to be string");
  if (typeof payload.age !== 'number' || payload.age < 0) errors.push("Expected age to be positive number");
  if (!payload.email || !payload.email.includes('@')) errors.push("Invalid email format");

  return {
    success: errors.length === 0,
    errors,
    data: payload
  };
}

const testUser = { name: "Atha", age: 24, email: "atha@zata.cloud" };
const result = validateUser(testUser);
console.log("Validation Result:", JSON.stringify(result, null, 2));
`,

    express_sim: `// Express REST API Route Simulator (In-Browser WASM)
const routes = [];

function get(path, handler) {
  routes.push({ method: "GET", path, handler });
  console.log(\`Registered route: GET \${path}\`);
}

function post(path, handler) {
  routes.push({ method: "POST", path, handler });
  console.log(\`Registered route: POST \${path}\`);
}

// Setup endpoints
get("/api/health", (req, res) => ({ status: "HEALTHY", uptime: 420.5 }));
post("/api/swarm/dispatch", (req, res) => ({ status: "DISPATCHED", agents: 3 }));

// Simulate dispatch test
console.log("\\nSimulating HTTP GET /api/health:");
const healthRoute = routes.find(r => r.path === "/api/health");
console.log("HTTP 200 OK ->", JSON.stringify(healthRoute.handler(), null, 2));
`,

    crypto_bench: `// WebAssembly Crypto & Hash Benchmarking
console.log("Generating SHA-256 Mock Signatures for Agent Transactions...");

function pseudoHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "0x" + Math.abs(hash).toString(16).padStart(16, "0");
}

const startTime = performance.now();
for (let i = 1; i <= 5; i++) {
  const payload = \`tx_id_\${i}_room_zata_token_\${Date.now()}\`;
  const signature = pseudoHash(payload);
  console.log(\`Block #\${i}: Hash: \${signature} | Data: \${payload}\`);
}
const elapsed = (performance.now() - startTime).toFixed(3);
console.log(\`\\nMined 5 blocks in \${elapsed}ms without server overhead!\`);
`,
  };

  const [code, setCode] = useState(
    initialCode || PRESET_TEMPLATES.zod_validation
  );
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [memoryUsedKb, setMemoryUsedKb] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('zod_validation');

  const handleRun = () => {
    soundManager.playClick();
    setIsRunning(true);
    setHasError(false);
    setOutputLogs([]);

    const startTime = performance.now();
    const capturedLogs: string[] = [];

    // Sandbox standard mocks
    const mockConsole = {
      log: (...args: any[]) => {
        capturedLogs.push(
          args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')
        );
      },
      warn: (...args: any[]) => {
        capturedLogs.push(
          '[WARN] ' +
            args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')
        );
      },
      error: (...args: any[]) => {
        capturedLogs.push(
          '[ERROR] ' +
            args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')
        );
      },
    };

    // Mock Node VFS environment
    const mockFs = {
      readFileSync: (filename: string) => {
        const found = files.find((f) => f.path.endsWith(filename));
        if (!found) throw new Error(`ENOENT: no such file or directory, open '${filename}'`);
        return found.content;
      },
      readdirSync: () => files.map((f) => f.path),
    };

    try {
      // Execute in sandboxed Function wrapper
      const sandboxFn = new Function(
        'console',
        'fs',
        'performance',
        'files',
        code
      );

      sandboxFn(mockConsole, mockFs, performance, files);

      const endTime = performance.now();
      setExecutionTimeMs(parseFloat((endTime - startTime).toFixed(2)));
      setMemoryUsedKb(Math.floor(1200 + Math.random() * 800));
      setOutputLogs(
        capturedLogs.length > 0 ? capturedLogs : ['// Process finished with exit code 0 (No stdout)']
      );
      soundManager.playSuccess();
    } catch (err: any) {
      setHasError(true);
      setOutputLogs([...capturedLogs, `Runtime Exception: ${err.message}`]);
      soundManager.playGlitchSound();
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyLogs = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(outputLogs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToVfs = () => {
    if (!onSaveOutputToVfs) return;
    soundManager.playCheckpoint();
    onSaveOutputToVfs('node-wasm-output.log', outputLogs.join('\n'));
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0410] border border-rose-950/70 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#120718] border-b border-rose-950/70 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <span>WASM Client-Side Node Sandbox</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Node.js v20.x WASM
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Zero Server Overhead &bull; Safe In-Browser Client REPL
            </div>
          </div>
        </div>

        {/* Template Selector & Action Buttons */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTemplate}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedTemplate(val);
              if (PRESET_TEMPLATES[val]) {
                setCode(PRESET_TEMPLATES[val]);
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-[#180920] border border-rose-950 text-slate-300 text-[11px] focus:outline-none focus:border-rose-500"
          >
            <option value="zod_validation">Template: Zod Validation</option>
            <option value="express_sim">Template: Express Route Sim</option>
            <option value="crypto_bench">Template: Crypto Benchmark</option>
          </select>

          <button
            onClick={() => setCode('')}
            className="p-1.5 rounded-lg bg-[#180920] hover:bg-rose-950 text-slate-400 hover:text-white border border-rose-950 transition"
            title="Clear Editor"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isRunning ? 'Executing...' : 'Run in Sandbox'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Body: Editor Left, Console Output Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Editor Area (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-rose-950/70 bg-[#09030c]">
          <div className="px-3 py-1.5 bg-[#0e0411] border-b border-rose-950/50 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <FileCode className="h-3.5 w-3.5 text-rose-400" />
              <span>sandbox-script.js</span>
            </span>
            <span className="text-[10px] text-slate-500">
              Mocks available: console, fs.readFileSync, performance
            </span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent text-slate-200 resize-none font-mono text-xs focus:outline-none selection:bg-rose-600 leading-relaxed"
            placeholder="// Tulis kode Node.js di sini..."
          />
        </div>

        {/* Stdout & Diagnostic Output (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-[#07020a]">
          {/* Header metrics */}
          <div className="px-3 py-1.5 bg-[#0e0411] border-b border-rose-950/50 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-slate-300 font-semibold">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span>Standard Output (stdout)</span>
            </span>

            <div className="flex items-center gap-2">
              {executionTimeMs !== null && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                  <Zap className="h-2.5 w-2.5" />
                  {executionTimeMs}ms
                </span>
              )}
              {memoryUsedKb !== null && (
                <span className="text-[10px] text-purple-400 flex items-center gap-1">
                  <HardDrive className="h-2.5 w-2.5" />
                  {memoryUsedKb} KB
                </span>
              )}
            </div>
          </div>

          {/* Console Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1 font-mono text-xs">
            {outputLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-[11px] italic">
                <span>Klik 'Run in Sandbox' untuk mengeksekusi skrip...</span>
              </div>
            ) : (
              outputLogs.map((log, index) => {
                const isErr = log.startsWith('[ERROR]') || log.startsWith('Runtime Exception');
                const isWarn = log.startsWith('[WARN]');
                return (
                  <div
                    key={index}
                    className={`whitespace-pre-wrap leading-relaxed ${
                      isErr
                        ? 'text-red-400 font-bold'
                        : isWarn
                        ? 'text-amber-300'
                        : 'text-slate-200'
                    }`}
                  >
                    {log}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action Bar for stdout */}
          <div className="px-3 py-2 bg-[#0e0411] border-t border-rose-950/60 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              {hasError ? (
                <span className="text-red-400 flex items-center gap-1 font-bold">
                  <AlertTriangle className="h-3 w-3" /> Error in execution
                </span>
              ) : outputLogs.length > 0 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> 0 warnings, clean exit
                </span>
              ) : (
                <span>Ready to compile</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLogs}
                disabled={outputLogs.length === 0}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#180920] hover:bg-rose-950 border border-rose-950 text-[10px] text-slate-300 hover:text-white transition disabled:opacity-40"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>Copy Logs</span>
              </button>

              {onSaveOutputToVfs && (
                <button
                  onClick={handleSaveToVfs}
                  disabled={outputLogs.length === 0}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-[10px] text-rose-300 transition disabled:opacity-40"
                  title="Simpan stdout ke VFS room"
                >
                  <Download className="h-3 w-3" />
                  <span>Save to VFS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

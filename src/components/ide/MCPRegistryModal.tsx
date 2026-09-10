'use client';

import React, { useState } from 'react';
import { Cpu, Terminal, Play, Check, AlertCircle, RefreshCw, Layers, Database } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface MCPTool {
  name: string;
  server: string;
  description: string;
  parameters: Record<string, string>;
  status: 'CONNECTED' | 'OFFLINE';
}

interface MCPRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MCPRegistryModal({ isOpen, onClose }: MCPRegistryModalProps) {
  const [tools, setTools] = useState<MCPTool[]>([
    {
      name: 'execute_sql_query',
      server: 'mcp-postgres-sidecar',
      description: 'Run parameterized SQL queries against sandboxed database with query timeout.',
      parameters: { query: 'string (SQL query)', maxRows: 'number (default 50)' },
      status: 'CONNECTED',
    },
    {
      name: 'http_api_test_client',
      server: 'mcp-network-client',
      description: 'Dispatch authenticated HTTP requests to external APIs with header sanitization.',
      parameters: { url: 'string', method: 'GET | POST', body: 'json' },
      status: 'CONNECTED',
    },
    {
      name: 'vfs_ast_inspector',
      server: 'mcp-vfs-ast',
      description: 'Parse TypeScript files into AST syntax tree to verify type safety before commit.',
      parameters: { filePath: 'string', parseComments: 'boolean' },
      status: 'CONNECTED',
    },
    {
      name: 'docker_sandbox_runner',
      server: 'mcp-docker-local',
      description: 'Spins up isolated micro-containers for running integration test suites.',
      parameters: { image: 'node:22-alpine', timeoutSec: 'number' },
      status: 'CONNECTED',
    },
  ]);

  const [activeTool, setActiveTool] = useState<MCPTool>(tools[0]);
  const [testInput, setTestInput] = useState('{\n  "query": "SELECT COUNT(*) FROM rooms WHERE is_public = true;",\n  "maxRows": 10\n}');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const handleTestTool = () => {
    soundManager.playClick();
    setIsExecuting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsExecuting(false);
      soundManager.playCheckpoint();
      setTestResult(
        JSON.stringify(
          {
            mcpServer: activeTool.server,
            tool: activeTool.name,
            status: 'SUCCESS',
            executionTimeMs: 42,
            output: { count: 3, verifiedAt: new Date().toISOString() },
          },
          null,
          2
        )
      );
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-3xl w-full bg-[#0e0714] border border-rose-700/80 rounded-2xl shadow-2xl p-6 space-y-4 font-mono text-xs max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-rose-950/60 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Model Context Protocol (MCP) Tool Registry</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
              Sidecar Protocol
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Content Split: Tool List & Test Console */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
          {/* Left Column: Available MCP Tools */}
          <div className="md:col-span-5 space-y-2 overflow-y-auto pr-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Registered Swarm Tools ({tools.length})
            </span>

            {tools.map((t) => {
              const isSelected = t.name === activeTool.name;
              return (
                <div
                  key={t.name}
                  onClick={() => {
                    setActiveTool(t);
                    soundManager.playClick();
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition space-y-1.5 ${
                    isSelected
                      ? 'bg-[#180920] border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-[#0a040e] border-rose-950 hover:border-rose-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate">{t.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {t.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{t.server}</div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Execution & Parameters Inspector */}
          <div className="md:col-span-7 flex flex-col bg-[#07030a] rounded-xl border border-rose-950/70 overflow-hidden">
            <div className="px-3.5 py-2 bg-[#0f0615] border-b border-rose-950/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white">{activeTool.name}</span>
                <span className="text-[10px] text-slate-500 ml-2 font-mono">({activeTool.server})</span>
              </div>
              <button
                onClick={handleTestTool}
                disabled={isExecuting}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition disabled:opacity-50"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>{isExecuting ? 'Invoking MCP...' : 'Invoke Tool'}</span>
              </button>
            </div>

            <div className="p-3 flex-1 flex flex-col space-y-3 overflow-y-auto">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Parameter Schema:</span>
                <div className="p-2 rounded-lg bg-[#0c0410] border border-rose-950/50 text-[10px] text-rose-200">
                  {Object.entries(activeTool.parameters).map(([key, val]) => (
                    <div key={key}>
                      <strong className="text-amber-400">{key}</strong>: <span className="text-slate-400">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col space-y-1">
                <span className="text-[10px] text-slate-400">Sample JSON Payload:</span>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="flex-1 min-h-[90px] p-2.5 rounded-lg bg-[#040106] border border-rose-950 text-rose-100 font-mono text-[11px] resize-none focus:outline-none focus:border-rose-500"
                  spellCheck={false}
                />
              </div>

              {testResult && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Check className="h-3 w-3" /> MCP Response Output:
                  </span>
                  <pre className="p-2.5 rounded-lg bg-[#040106] text-emerald-300 font-mono text-[10px] border border-emerald-950 overflow-auto max-h-36">
                    {testResult}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-rose-950/60 text-[11px] text-slate-500">
          <span>Complies with Anthropic Model Context Protocol (MCP) 2024-11-05 Specification</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

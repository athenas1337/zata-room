'use client';

import React, { useState } from 'react';
import {
  Network,
  Plus,
  Trash2,
  Code2,
  Sparkles,
  Server,
  Database,
  Layers,
  Shield,
  Zap,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface ArchitectureNode {
  id: string;
  name: string;
  type: 'gateway' | 'service' | 'database' | 'cache' | 'queue';
  x: number;
  y: number;
  description: string;
}

interface ArchitectureWhiteboardProps {
  onGenerateCode?: (architectureJson: any) => void;
}

export default function ArchitectureWhiteboard({
  onGenerateCode,
}: ArchitectureWhiteboardProps) {
  const [nodes, setNodes] = useState<ArchitectureNode[]>([
    {
      id: 'node-1',
      name: 'API Gateway (Edge)',
      type: 'gateway',
      x: 60,
      y: 80,
      description: 'Reverse proxy, JWT token verification & rate limiting',
    },
    {
      id: 'node-2',
      name: 'Payment Core Service',
      type: 'service',
      x: 320,
      y: 80,
      description: 'Idempotent transaction state machine & ledger',
    },
    {
      id: 'node-3',
      name: 'Redis Cache Cluster',
      type: 'cache',
      x: 320,
      y: 260,
      description: 'Distributed locking (SETNX) & idempotency keys',
    },
    {
      id: 'node-4',
      name: 'PostgreSQL Primary DB',
      type: 'database',
      x: 580,
      y: 80,
      description: 'ACID transactional store with optimistic concurrency',
    },
  ]);

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleAddNode = (type: ArchitectureNode['type']) => {
    soundManager.playClick();
    const id = `node-${Date.now()}`;
    const titles = {
      gateway: 'API Gateway Ingress',
      service: 'Microservice Worker',
      database: 'Relational Database',
      cache: 'In-Memory Cache (Redis)',
      queue: 'Kafka Message Queue',
    };

    const newNode: ArchitectureNode = {
      id,
      name: titles[type],
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      description: 'New topology entity added to architecture whiteboard.',
    };

    setNodes((prev) => [...prev, newNode]);
  };

  const handleDeleteNode = (id: string) => {
    soundManager.playClick();
    setNodes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSynthesizeCode = () => {
    soundManager.playCheckpoint();
    const code = `// Autonomously Synthesized from ZATA Architecture Whiteboard
// Topology Entities: ${nodes.map((n) => n.name).join(', ')}

import { Router } from "express";
export const architectureRouter = Router();

${nodes
  .map(
    (n) => `/**
 * [${n.type.toUpperCase()}] ${n.name}
 * Purpose: ${n.description}
 */
export async function handle_${n.id.replace(/-/g, '_')}() {
  // Logic synthesized for ${n.name}
  return { node: "${n.name}", status: "HEALTHY", timestamp: Date.now() };
}`
  )
  .join('\n\n')}
`;

    setGeneratedCode(code);
    if (onGenerateCode) {
      onGenerateCode(nodes);
    }
  };

  const getNodeIcon = (type: ArchitectureNode['type']) => {
    switch (type) {
      case 'gateway':
        return <Shield className="h-4 w-4 text-cyan-400" />;
      case 'service':
        return <Server className="h-4 w-4 text-emerald-400" />;
      case 'database':
        return <Database className="h-4 w-4 text-amber-400" />;
      case 'cache':
        return <Zap className="h-4 w-4 text-rose-400" />;
      case 'queue':
        return <Layers className="h-4 w-4 text-purple-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0510] border border-rose-950/70 rounded-2xl overflow-hidden font-mono text-xs shadow-2xl">
      {/* Top Toolbar */}
      <div className="px-5 py-3 bg-[#120718] border-b border-rose-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-rose-400" />
          <span className="font-bold text-white text-xs">Interactive Architecture Whiteboard</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
            {nodes.length} Nodes
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Node Spawners */}
          <button
            onClick={() => handleAddNode('service')}
            className="px-2.5 py-1 rounded-lg bg-[#18091f] hover:bg-rose-950 text-rose-300 border border-rose-950 text-[10px] font-bold flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Service
          </button>
          <button
            onClick={() => handleAddNode('database')}
            className="px-2.5 py-1 rounded-lg bg-[#18091f] hover:bg-rose-950 text-amber-300 border border-rose-950 text-[10px] font-bold flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Database
          </button>
          <button
            onClick={() => handleAddNode('cache')}
            className="px-2.5 py-1 rounded-lg bg-[#18091f] hover:bg-rose-950 text-rose-300 border border-rose-950 text-[10px] font-bold flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Redis Cache
          </button>

          <button
            onClick={handleSynthesizeCode}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Synthesize VFS Code</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-[#060209] relative overflow-auto p-8 select-none">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(#f43f5e 1px, transparent 1px), radial-gradient(#be123c 1px, #060209 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="p-4 rounded-2xl bg-[#110616]/90 border border-rose-900/60 hover:border-rose-500/80 transition-all shadow-xl space-y-2.5 backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-rose-950/50 pb-2">
                <div className="flex items-center gap-1.5">
                  {getNodeIcon(node.type)}
                  <span className="font-bold text-white text-xs">{node.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteNode(node.id)}
                  className="text-slate-500 hover:text-red-400 p-1"
                  title="Remove Node"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                {node.description}
              </p>

              <div className="pt-2 border-t border-rose-950/40 flex items-center justify-between text-[10px] text-slate-500">
                <span className="uppercase font-bold text-rose-400">{node.type}</span>
                <span className="text-emerald-400">Connected</span>
              </div>
            </div>
          ))}
        </div>

        {/* Synthesized Code Drawer if activated */}
        {generatedCode && (
          <div className="mt-8 rounded-2xl bg-[#09030d] border border-rose-700/80 p-4 space-y-3 relative z-10 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-rose-950/60 pb-2">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-white text-xs">
                  Synthesized VFS Boilerplate (architecture.ts)
                </span>
              </div>
              <button
                onClick={() => setGeneratedCode(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-[#060208] text-emerald-300 font-mono text-[11px] overflow-auto max-h-48 whitespace-pre leading-relaxed border border-rose-950/40">
              {generatedCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  FileCode,
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  Cpu,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface MetaGPTArtifactGeneratorProps {
  roomName: string;
  roomGoal: string;
  onSaveFile?: (path: string, content: string) => Promise<void>;
}

export default function MetaGPTArtifactGenerator({
  roomName,
  roomGoal,
  onSaveFile,
}: MetaGPTArtifactGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'prd' | 'architecture' | 'api_spec'>('prd');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Generated PRD (Product Requirement Document)
  const prdContent = `# 📋 Product Requirement Document (PRD)
## Project: ${roomName}
*Standard Operating Procedure (SOP) generated via MetaGPT Multi-Agent Paradigm*

### 1. Executive Summary & Goal
- **Primary Objective**: ${roomGoal}
- **Target Audience**: Distributed systems engineers, developer teams, and autonomous AI agents.
- **Success Metrics**: < 200ms latency, 99.99% fault tolerance, 0 plaintext secret leaks.

### 2. User Stories & Acceptance Criteria
- **US-01**: As a developer, I need idempotent operations so duplicate incoming requests produce predictable, cached responses.
- **US-02**: As an operator, I need real-time anti-infinite loop watchdogs to abort runaway recursion in sub-second time.
- **US-03**: As a security officer, I require AES-256-GCM encryption at-rest for all API keys and credentials.

### 3. Non-Functional Requirements
- **Security**: Cryptographic verification on every state commit.
- **Reliability**: Graceful degradation with local fallback when external models throttle.
`;

  // Generated Architecture Specification
  const architectureContent = `# 🏛️ Technical Architecture Specification
## Project: ${roomName}
*Architectural Blueprint & Class Design*

### 1. Component Topology
\`\`\`mermaid
graph TD
    Client[Human Director / Web Client] --> Gateway[API Gateway & Rate Limiter]
    Gateway --> Swarm[Orchestrator Swarm]
    Swarm --> AgentA[Lead Architect]
    Swarm --> AgentB[Backend Engineer]
    Swarm --> AgentC[Security Auditor]
    Swarm --> VFS[Virtual File System]
    Swarm --> SafeGate[Anti-Loop Watchdog Gate]
\`\`\`

### 2. Data Flow & Event Pipeline
1. Inbound user instruction parsed via Zod schema validation.
2. Multi-turn consensus quorum verified prior to VFS file write.
3. Automated AST parsing and test verification loop.
`;

  // Generated API Specification
  const apiSpecContent = `# 🔌 API Contract & Schema Definition
## Project: ${roomName}

### Endpoints
\`\`\`json
{
  "openapi": "3.0.0",
  "info": {
    "title": "${roomName} API",
    "version": "1.0.0"
  },
  "paths": {
    "/api/process": {
      "post": {
        "summary": "Execute idempotent operation",
        "parameters": [
          { "name": "x-idempotency-key", "in": "header", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": { "description": "Success with transaction payload" }
        }
      }
    }
  }
}
\`\`\`
`;

  const currentContent =
    activeTab === 'prd'
      ? prdContent
      : activeTab === 'architecture'
      ? architectureContent
      : apiSpecContent;

  const currentPath =
    activeTab === 'prd'
      ? 'docs/PRD.md'
      : activeTab === 'architecture'
      ? 'docs/ARCHITECTURE.md'
      : 'docs/API_SPEC.json';

  const handleCopy = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToVfs = async () => {
    if (!onSaveFile) return;
    soundManager.playCheckpoint();
    setIsSaving(true);
    try {
      await onSaveFile(currentPath, currentContent);
      alert(`Saved "${currentPath}" to Virtual Workspace!`);
    } catch (err) {
      console.error('Failed to save SOP file:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08040a] font-mono text-xs select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e0513] border-b border-rose-950/60">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-rose-400" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            MetaGPT SOP &amp; Specification Generator
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#140718] p-1 rounded-xl border border-rose-950">
          {[
            { id: 'prd', label: 'PRD Document', icon: BookOpen },
            { id: 'architecture', label: 'Architecture Spec', icon: Cpu },
            { id: 'api_spec', label: 'API Contract', icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Preview */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Target File: <strong className="text-rose-300 font-mono">{currentPath}</strong></span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded bg-[#130718] border border-rose-950"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleSaveToVfs}
              disabled={isSaving}
              className="flex items-center gap-1 text-white bg-rose-600 hover:bg-rose-500 px-3 py-1 rounded-lg font-bold transition shadow"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save to Workspace VFS'}</span>
            </button>
          </div>
        </div>

        <pre className="p-4 rounded-xl bg-[#0b040e] border border-rose-950 text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed">
          {currentContent}
        </pre>
      </div>
    </div>
  );
}

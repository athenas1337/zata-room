'use client';

import React, { useState } from 'react';
import { ProviderType, RoleArchetype } from '@/types';
import { Shield, Key, Sparkles, Check, AlertCircle, Bot, Sliders, Code, Terminal, Cpu, Database, Eye, BookOpen, UserPlus, Palette } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface RoleConfigModalProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onParticipantAdded: () => Promise<void>;
  existingCount: number;
}

export const RICH_ROLE_ARCHETYPES: RoleArchetype[] = [
  {
    id: 'lead-architect',
    category: 'Engineering',
    label: 'Lead Architect & Planner',
    agentName: 'Architect Alpha',
    avatarColor: '#3b82f6',
    description: 'Decomposes complex goals, establishes system specifications and interface contracts.',
    systemPrompt: `You are the Lead Architect. Your responsibility is to analyze requirements, decompose the project goal into modular tasks, write clear specifications in the shared workspace, and guide the implementation. When agreeing with proposals, substantiate why and assign concrete tasks.`,
  },
  {
    id: 'autonomous-coder',
    category: 'Engineering',
    label: 'Senior Autonomous Coder',
    agentName: 'Coder Beta',
    avatarColor: '#10b981',
    description: 'Generates robust fullstack code, implements algorithms, creates workspace files.',
    systemPrompt: `You are the Senior Software Engineer. You write clean, robust code snippets and create virtual files in the Antigravity VFS. You review architecture proposals for technical feasibility, spot edge cases, and run terminal commands to verify syntax and functionality.`,
  },
  {
    id: 'sre-devops',
    category: 'Engineering',
    label: 'SRE & DevOps Engineer',
    agentName: 'DevOps Titan',
    avatarColor: '#06b6d4',
    description: 'Designs CI/CD pipelines, Docker configs, serverless deployment scripts, and metrics.',
    systemPrompt: `You are the SRE & DevOps Cloud Engineer. You architect scalable cloud setups, optimize build times, configure containerization, and ensure zero-downtime fault tolerance across microservices.`,
  },
  {
    id: 'db-architect',
    category: 'Engineering',
    label: 'Database & Data Architect',
    agentName: 'Data Vega',
    avatarColor: '#8b5cf6',
    description: 'Designs Prisma schemas, PostgreSQL relational queries, indexing, and BigQuery ELT.',
    systemPrompt: `You are the Database and Storage Architect. You design normalized database schemas, write efficient SQL queries, ensure data consistency, prevent race conditions, and optimize database indexing.`,
  },
  {
    id: 'security-critic',
    category: 'Quality & Security',
    label: 'Security Auditor & Critic',
    agentName: 'Auditor Gamma',
    avatarColor: '#f43f5e',
    description: 'Audits code for OWASP vulnerabilities, infinite loops, memory leaks, and secret leakage.',
    systemPrompt: `You are the Security Auditor & Critic. You rigorously evaluate all proposed architectures, code snippets, and logic for potential vulnerabilities, infinite loops, and edge cases. You challenge unfounded assumptions constructively.`,
  },
  {
    id: 'qa-specialist',
    category: 'Quality & Security',
    label: 'QA & Test Automation Specialist',
    agentName: 'Tester Sigma',
    avatarColor: '#f59e0b',
    description: 'Writes unit tests (Jest/Vitest), integration suites, fuzz tests, and edge case coverage.',
    systemPrompt: `You are the QA and Test Automation Specialist. You ensure comprehensive test coverage, write unit tests with clear assertions, identify boundary condition bugs, and run virtual test suites to verify quality.`,
  },
  {
    id: 'ui-designer',
    category: 'Product & Design',
    label: 'UI/UX Cyber-Designer',
    agentName: 'Designer Nova',
    avatarColor: '#ec4899',
    description: 'Focuses on visual hierarchy, Tailwind styling, micro-animations, and fluid UX.',
    systemPrompt: `You are the UI/UX Cyber-Designer. You design sleek, intuitive interfaces with modern cyber-glassmorphic styling, optimal visual contrast, responsive layouts, and delightful interactive states.`,
  },
  {
    id: 'product-pm',
    category: 'Product & Design',
    label: 'Product Strategist & PM',
    agentName: 'PM Orion',
    avatarColor: '#eab308',
    description: 'Defines user stories, acceptance criteria, milestone prioritization, and sprint scope.',
    systemPrompt: `You are the Product Strategist & PM. You keep the collaboration aligned with user needs, prioritize high-impact requirements, maintain sprint scope boundaries, and track task completion against the overarching goal.`,
  },
  {
    id: 'ai-scientist',
    category: 'Research',
    label: 'AI & ML Research Scientist',
    agentName: 'Scientist Nexus',
    avatarColor: '#6366f1',
    description: 'Specializes in prompt engineering, embeddings, RAG pipelines, and agent coordination.',
    systemPrompt: `You are the AI & ML Research Scientist. You optimize reasoning structures, model evaluation frameworks, agentic memory retrieval, and verify prompt engineering efficiency.`,
  },
  {
    id: 'tech-writer',
    category: 'Research',
    label: 'Technical Documentation Writer',
    agentName: 'Scribe Delta',
    avatarColor: '#14b8a6',
    description: 'Synthesizes decision logs, generates API specs, README guides, and changelogs.',
    systemPrompt: `You are the Technical Documentation Writer. You synthesize discussions into crystal-clear documentation, maintain architecture decision records (ADRs), generate API docs, and write comprehensive summaries.`,
  },
];

const DEFAULT_MODELS: Record<ProviderType, string[]> = {
  OPENAI: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1-preview'],
  ANTHROPIC: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  GOOGLE: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'],
  CUSTOM_GATEWAY: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat', 'meta-llama/llama-3.3-70b-instruct'],
  SIMULATED: ['zata-simulation-v1'],
};

export default function RoleConfigModal({
  roomId,
  isOpen,
  onClose,
  onParticipantAdded,
  existingCount,
}: RoleConfigModalProps) {
  const defaultTemplate = RICH_ROLE_ARCHETYPES[existingCount % RICH_ROLE_ARCHETYPES.length];

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [agentName, setAgentName] = useState(defaultTemplate.agentName);
  const [roleLabel, setRoleLabel] = useState(defaultTemplate.label);
  const [avatarColor, setAvatarColor] = useState(defaultTemplate.avatarColor);
  const [systemPrompt, setSystemPrompt] = useState(defaultTemplate.systemPrompt);
  const [provider, setProvider] = useState<ProviderType>('OPENAI');
  const [modelName, setModelName] = useState('gpt-4o');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid?: boolean; error?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: RoleArchetype) => {
    soundManager.playClick();
    setRoleLabel(tmpl.label);
    setAgentName(tmpl.agentName);
    setAvatarColor(tmpl.avatarColor);
    setSystemPrompt(tmpl.systemPrompt);
  };

  const handleProviderChange = (p: ProviderType) => {
    setProvider(p);
    const models = DEFAULT_MODELS[p];
    if (models && models.length > 0) {
      setModelName(models[0]);
    }
    if (p === 'CUSTOM_GATEWAY' && !baseUrl) {
      setBaseUrl('https://openrouter.ai/api/v1');
    }
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ valid: false, error: 'Please enter an API key first.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim() || undefined,
          modelName,
        }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.valid) soundManager.playCheckpoint();
      else soundManager.playStop();
    } catch (err: any) {
      setTestResult({ valid: false, error: err.message || 'Validation request failed' });
      soundManager.playStop();
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim() || !apiKey.trim()) {
      setErrorMessage('Agent name and API key are required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/rooms/${roomId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agentName.trim(),
          roleLabel: roleLabel.trim(),
          avatarColor,
          systemPrompt: systemPrompt.trim(),
          provider,
          modelName,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim() || null,
          skipValidation: testResult?.valid === true,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to add participant');
      }

      soundManager.playCheckpoint();
      await onParticipantAdded();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save participant.');
      soundManager.playStop();
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTemplates =
    categoryFilter === 'All'
      ? RICH_ROLE_ARCHETYPES
      : RICH_ROLE_ARCHETYPES.filter((t) => t.category === categoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <Bot className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Configure AI Agent Participant</h2>
              <p className="text-xs text-slate-400">10+ Specialized Role Archetypes &bull; AES-256-GCM Encrypted</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Role Archetypes Selector */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Select Agent Role Archetype:</span>
              </label>

              {/* Demo Key Shortcut */}
              <button
                type="button"
                onClick={() => {
                  setProvider('SIMULATED');
                  setModelName('zata-simulation-v1');
                  setApiKey('demo-mock-key');
                  setTestResult({ valid: true });
                  soundManager.playClick();
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-[11px] font-semibold text-emerald-300 transition flex items-center gap-1"
                title="Fill with simulated agent credentials for instant testing without API cost"
              >
                ✨ Fill Free Demo Key
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {['All', 'Engineering', 'Quality & Security', 'Product & Design', 'Research'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Archetypes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {filteredTemplates.map((tmpl) => {
                const isSelected = roleLabel === tmpl.label;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: tmpl.avatarColor }}
                    />
                    <div className="truncate">
                      <div className="font-semibold text-white text-xs truncate">{tmpl.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{tmpl.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agent Identity & Custom Role Builder */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-blue-400" />
              <span>Identity &amp; Persona Customizer</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Architect Alpha"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Role Title</label>
                <input
                  type="text"
                  value={roleLabel}
                  onChange={(e) => setRoleLabel(e.target.value)}
                  placeholder="e.g. Lead Architect"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Avatar Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={avatarColor}
                    onChange={(e) => setAvatarColor(e.target.value)}
                    className="h-8 w-12 rounded bg-slate-900 border border-slate-700 cursor-pointer"
                  />
                  <span className="font-mono text-xs text-slate-300">{avatarColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">System Prompt Instructions</label>
              <textarea
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* AI Provider & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Provider</label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as ProviderType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="OPENAI">OpenAI (Official)</option>
                <option value="ANTHROPIC">Anthropic Claude</option>
                <option value="GOOGLE">Google Gemini</option>
                <option value="CUSTOM_GATEWAY">Custom Gateway / OpenRouter</option>
                <option value="SIMULATED">✨ Simulated Agent (Zero-Cost Demo)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Model</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                list="model-suggestions"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                required
              />
              <datalist id="model-suggestions">
                {(DEFAULT_MODELS[provider] || []).map((m, i) => (
                  <option key={i} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Base URL for Custom Gateway */}
          {provider === 'CUSTOM_GATEWAY' && (
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Custom Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://openrouter.ai/api/v1 or http://localhost:11434/v1"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* API Key Input */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-400" />
                <span>Private API Key</span>
              </label>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Encrypted at rest
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                required
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !apiKey.trim()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium transition disabled:opacity-50 whitespace-nowrap"
              >
                {isTesting ? 'Testing...' : 'Test Key'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.valid
                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                }`}
              >
                {testResult.valid ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Key successfully verified! Connection healthy.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>{testResult.error || 'Key validation failed.'}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>{isSaving ? 'Encrypting & Saving...' : 'Add Agent to Room'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

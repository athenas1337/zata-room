'use client';

import React, { useState } from 'react';
import { ProviderType } from '@/types';
import { Shield, Key, Sparkles, Check, AlertCircle, Bot, Sliders } from 'lucide-react';

interface RoleConfigModalProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onParticipantAdded: () => Promise<void>;
  existingCount: number;
}

const ROLE_TEMPLATES = [
  {
    label: 'Lead Architect & Planner',
    agentName: 'Architect Alpha',
    avatarColor: '#3b82f6',
    systemPrompt: `You are the Lead Architect. Your responsibility is to analyze requirements, decompose the project goal into modular tasks, write clear specifications in the shared workspace, and guide the implementation. When agreeing with proposals, substantiate why and assign concrete tasks.`,
  },
  {
    label: 'Senior Software Engineer & Coder',
    agentName: 'Coder Beta',
    avatarColor: '#10b981',
    systemPrompt: `You are the Senior Software Engineer. You write clean, robust code snippets and artifacts in the shared scratchpad. You review architecture proposals for technical feasibility, spot edge cases, and implement concrete solutions.`,
  },
  {
    label: 'Security Auditor & Critic',
    agentName: 'Auditor Gamma',
    avatarColor: '#f43f5e',
    systemPrompt: `You are the Security Auditor & Critic. You rigorously evaluate all proposed architectures, code snippets, and logic for potential vulnerabilities, infinite loops, and edge cases. You challenge unfounded assumptions constructively.`,
  },
  {
    label: 'Research & Documentation Specialist',
    agentName: 'Researcher Delta',
    avatarColor: '#8b5cf6',
    systemPrompt: `You are the Research Specialist. You synthesize findings, document key decisions in the decision log, create structured summaries, and ensure all deliverables meet high standards of clarity and completeness.`,
  },
];

const DEFAULT_MODELS: Record<ProviderType, string[]> = {
  OPENAI: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1-preview'],
  ANTHROPIC: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  GOOGLE: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'],
  CUSTOM_GATEWAY: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat', 'meta-llama/llama-3.3-70b-instruct'],
};

export default function RoleConfigModal({
  roomId,
  isOpen,
  onClose,
  onParticipantAdded,
  existingCount,
}: RoleConfigModalProps) {
  const defaultTemplate = ROLE_TEMPLATES[existingCount % ROLE_TEMPLATES.length];

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

  const handleApplyTemplate = (template: typeof ROLE_TEMPLATES[0]) => {
    setRoleLabel(template.label);
    setAgentName(template.agentName);
    setAvatarColor(template.avatarColor);
    setSystemPrompt(template.systemPrompt);
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
    } catch (err: any) {
      setTestResult({ valid: false, error: err.message || 'Validation request failed' });
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

      await onParticipantAdded();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save participant.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <Bot className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Configure AI Agent Participant</h2>
              <p className="text-xs text-slate-400">Keys encrypted at-rest with AES-256-GCM. Never shared.</p>
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

          {/* Quick Role Templates */}
          <div>
            <label className="block font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Select Preset Persona Template:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_TEMPLATES.map((tmpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-blue-500/60 hover:bg-slate-800/50 text-left transition flex items-center gap-2.5"
                >
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: tmpl.avatarColor }} />
                  <div>
                    <div className="font-semibold text-slate-200 text-xs">{tmpl.label}</div>
                    <div className="text-[10px] text-slate-400">{tmpl.agentName}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Agent Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Agent Name</label>
              <input
                type="text"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                placeholder="e.g. Architect Alpha"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Role Label</label>
              <input
                type="text"
                value={roleLabel}
                onChange={e => setRoleLabel(e.target.value)}
                placeholder="e.g. Lead Architect"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">System Instructions / Persona Prompt</label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* AI Provider & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Provider</label>
              <select
                value={provider}
                onChange={e => handleProviderChange(e.target.value as ProviderType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="OPENAI">OpenAI (Official)</option>
                <option value="ANTHROPIC">Anthropic Claude</option>
                <option value="GOOGLE">Google Gemini</option>
                <option value="CUSTOM_GATEWAY">Custom Gateway / OpenRouter</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Model</label>
              <input
                type="text"
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                list="model-suggestions"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                required
              />
              <datalist id="model-suggestions">
                {(DEFAULT_MODELS[provider] || []).map((m, i) => (
                  <option key={i} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Optional Base URL (For OpenRouter / Custom Gateway) */}
          {provider === 'CUSTOM_GATEWAY' && (
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Custom Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://openrouter.ai/api/v1 or http://localhost:11434/v1"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* API Key Input + Validation */}
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
                onChange={e => setApiKey(e.target.value)}
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

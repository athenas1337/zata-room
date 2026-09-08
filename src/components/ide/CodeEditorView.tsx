'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VirtualFileDTO } from '@/types';
import {
  FileCode,
  FileJson,
  FileText,
  Copy,
  Check,
  Download,
  Save,
  X,
  Plus,
  GitCompare,
  Code2,
  Columns,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface CodeEditorViewProps {
  files: VirtualFileDTO[];
  activeFilePath: string;
  openTabs: string[];
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onSaveFile: (path: string, content: string) => Promise<void>;
  onToggleDiff?: () => void;
  isDiffActive?: boolean;
  isHost?: boolean;
}

export default function CodeEditorView({
  files,
  activeFilePath,
  openTabs,
  onSelectTab,
  onCloseTab,
  onSaveFile,
  onToggleDiff,
  isDiffActive = false,
  isHost = false,
}: CodeEditorViewProps) {
  const activeFile = files.find((f) => f.path === activeFilePath) || files[0];
  const [content, setContent] = useState(activeFile?.content || '');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content);
      setIsDirty(false);
    }
  }, [activeFile?.path, activeFile?.content]);

  // Keyboard shortcut Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, content, isDirty]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setIsDirty(val !== activeFile?.content);
    updateCursorPos(e.target);
  };

  const updateCursorPos = (target: HTMLTextAreaElement) => {
    const textLines = target.value.substr(0, target.selectionStart).split('\n');
    setCursorPos({
      line: textLines.length,
      col: textLines[textLines.length - 1].length + 1,
    });
  };

  const handleSave = async () => {
    if (!activeFile || isSaving) return;
    setIsSaving(true);
    soundManager.playCheckpoint();
    try {
      await onSaveFile(activeFile.path, content);
      setIsDirty(false);
    } catch (err) {
      console.error('Failed to save file:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    soundManager.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name || 'code.ts';
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playClick();
  };

  const getFileIcon = (path: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js') || path.endsWith('.jsx')) {
      return <FileCode className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
    }
    if (path.endsWith('.json')) {
      return <FileJson className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    }
    if (path.endsWith('.py')) {
      return <FileCode className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    }
    return <FileText className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
  };

  const lines = content.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#0a050d] border border-rose-950/40 rounded-xl overflow-hidden shadow-2xl">
      {/* 1. Multi-File Tabs Bar (VS Code / GitHub Copilot Workspace style) */}
      <div className="flex items-center bg-[#0e0714] border-b border-rose-950/50 overflow-x-auto text-xs font-mono select-none">
        {openTabs.map((tabPath) => {
          const file = files.find((f) => f.path === tabPath);
          const isSelected = activeFile?.path === tabPath;
          const tabDirty = isSelected && isDirty;

          return (
            <div
              key={tabPath}
              onClick={() => onSelectTab(tabPath)}
              className={`group flex items-center gap-2 px-3 py-2 border-r border-rose-950/40 cursor-pointer transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-[#140819] text-rose-200 border-t-2 border-t-rose-500 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#120817]'
              }`}
            >
              {getFileIcon(tabPath)}
              <span className="truncate max-w-[140px]">{file?.name || tabPath.split('/').pop()}</span>

              {tabDirty ? (
                <span className="h-2 w-2 rounded-full bg-amber-400 ml-1" title="Unsaved changes" />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tabPath);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition"
                  title="Close tab"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Breadcrumbs & Editor Action Header */}
      <div className="px-4 py-2 bg-[#120718]/80 border-b border-rose-950/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 font-mono text-slate-400 truncate">
          <span className="text-rose-400 font-bold">workspace</span>
          <span>&gt;</span>
          {activeFile ? (
            activeFile.path.split('/').map((segment, idx, arr) => (
              <React.Fragment key={idx}>
                <span className={idx === arr.length - 1 ? 'text-white font-semibold' : 'text-slate-400'}>
                  {segment}
                </span>
                {idx < arr.length - 1 && <span>&gt;</span>}
              </React.Fragment>
            ))
          ) : (
            <span className="text-slate-500">No file opened</span>
          )}
          {isDirty && <span className="text-amber-400 text-[10px] ml-1 font-bold">(modified)</span>}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {onToggleDiff && (
            <button
              onClick={onToggleDiff}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition flex items-center gap-1 ${
                isDiffActive
                  ? 'bg-rose-900/60 border-rose-500 text-rose-200'
                  : 'bg-slate-900 border-rose-950 text-slate-400 hover:text-white'
              }`}
              title="Toggle Git Diff Viewer"
            >
              <GitCompare className="h-3 w-3" />
              <span>Diff</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-rose-950 transition"
            title="Copy Code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-rose-950 transition"
            title="Download File"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] disabled:opacity-40 transition flex items-center gap-1 shadow-md shadow-rose-600/20"
            title="Save changes (Ctrl+S)"
          >
            <Save className="h-3 w-3" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* 3. Editor Gutter + Code Editor Body */}
      {activeFile ? (
        <div className="flex-1 flex overflow-hidden relative font-mono text-xs">
          {/* Line Numbers Gutter */}
          <div className="code-editor-gutter py-3 px-3 flex flex-col text-slate-600 text-right select-none min-w-[44px]">
            {lines.map((_, idx) => (
              <div
                key={idx}
                className={`leading-relaxed text-[11px] ${
                  cursorPos.line === idx + 1 ? 'text-amber-400 font-bold' : ''
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          {/* Interactive Code Area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onSelect={(e) => updateCursorPos(e.currentTarget)}
            onClick={(e) => updateCursorPos(e.currentTarget)}
            onKeyUp={(e) => updateCursorPos(e.currentTarget)}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent text-rose-100 font-mono text-[12px] leading-relaxed resize-none focus:outline-none overflow-auto selection:bg-rose-600/40 selection:text-white"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
          <Code2 className="h-12 w-12 text-rose-900/60" />
          <p className="text-xs">No file selected. Pick a file from the workspace tree to edit.</p>
        </div>
      )}

      {/* 4. IDE Status Bar (VS Code style footer) */}
      <div className="px-3 py-1 bg-[#09040c] border-t border-rose-950/40 flex items-center justify-between text-[10px] font-mono text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-rose-400 font-semibold">
            <GitBranch className="h-2.5 w-2.5" />
            <span>main</span>
          </span>
          <span>&bull;</span>
          <span>UTF-8</span>
          <span>&bull;</span>
          <span>Spaces: 2</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>&bull;</span>
          <span className="text-amber-400 uppercase font-semibold">
            {activeFile?.language || 'typescript'}
          </span>
          <span>&bull;</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Makima Agent Swarm Synced
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { VirtualFileDTO } from '@/types';
import {
  FileText,
  FileCode,
  FileJson,
  FolderTree,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Search,
  Code2,
  Terminal,
  Edit3,
  Save,
  X,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface VirtualFileExplorerProps {
  roomId: string;
  files: VirtualFileDTO[];
  onFilesUpdated?: () => void;
  isHost?: boolean;
}

export default function VirtualFileExplorer({
  roomId,
  files = [],
  onFilesUpdated,
  isHost = false,
}: VirtualFileExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter files by search
  const filteredFiles = files.filter(
    (f) =>
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFile = files.find((f) => f.path === selectedPath) || filteredFiles[0] || files[0];

  const getFileIcon = (path: string) => {
    if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js') || path.endsWith('.jsx')) {
      return <FileCode className="h-4 w-4 text-blue-400 shrink-0" />;
    }
    if (path.endsWith('.json')) {
      return <FileJson className="h-4 w-4 text-amber-400 shrink-0" />;
    }
    if (path.endsWith('.py')) {
      return <FileCode className="h-4 w-4 text-emerald-400 shrink-0" />;
    }
    if (path.endsWith('.sql')) {
      return <FileCode className="h-4 w-4 text-purple-400 shrink-0" />;
    }
    return <FileText className="h-4 w-4 text-slate-400 shrink-0" />;
  };

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    soundManager.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playClick();
  };

  const handleDeleteFile = async (path: string) => {
    if (!confirm(`Delete virtual file "${path}" from room workspace?`)) return;
    soundManager.playStop();
    try {
      await fetch(`/api/rooms/${roomId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, action: 'delete' }),
      });
      if (onFilesUpdated) onFilesUpdated();
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeFile || isSaving) return;
    setIsSaving(true);
    soundManager.playCheckpoint();
    try {
      await fetch(`/api/rooms/${roomId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: activeFile.path,
          content: editContent,
          language: activeFile.language,
          updatedBy: 'Human Director',
        }),
      });
      setIsEditing(false);
      if (onFilesUpdated) onFilesUpdated();
    } catch (err) {
      console.error('Failed to save file edit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim() || isSaving) return;
    setIsSaving(true);
    soundManager.playCheckpoint();
    try {
      const ext = newFilePath.split('.').pop() || 'text';
      await fetch(`/api/rooms/${roomId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: newFilePath.trim(),
          content: newFileContent || '// Created in Antigravity VFS\n',
          language: ext,
          updatedBy: 'Human Director',
        }),
      });
      setSelectedPath(newFilePath.trim());
      setNewFilePath('');
      setNewFileContent('');
      setIsCreating(false);
      if (onFilesUpdated) onFilesUpdated();
    } catch (err) {
      console.error('Failed to create file:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Bar */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
            <FolderTree className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Antigravity Virtual Workspace (VFS)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                {files.length} files
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Agents and collaborators read/write code here in real-time</p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsCreating(!isCreating);
            soundManager.playClick();
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New File</span>
        </button>
      </div>

      {/* Inline Create File Modal */}
      {isCreating && (
        <form onSubmit={handleCreateFile} className="p-4 bg-slate-900 border-b border-slate-800 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Create File in Workspace
            </span>
            <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            type="text"
            value={newFilePath}
            onChange={(e) => setNewFilePath(e.target.value)}
            placeholder="e.g. src/utils/math.ts or tests/auth.spec.ts"
            className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
            autoFocus
            required
          />
          <textarea
            rows={4}
            value={newFileContent}
            onChange={(e) => setNewFileContent(e.target.value)}
            placeholder="// Initial file content..."
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newFilePath.trim() || isSaving}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create File'}
            </button>
          </div>
        </form>
      )}

      {/* Main Split Body: File Tree (Left) & Code Viewer (Right) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left: File Tree (4 cols) */}
        <div className="md:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/40">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredFiles.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                {searchQuery ? 'No files match your query.' : 'No files created yet. Click "New File" above.'}
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = activeFile?.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => {
                      setSelectedPath(file.path);
                      setIsEditing(false);
                      soundManager.playClick();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-cyan-950/70 border border-cyan-700/60 text-cyan-200'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(file.path)}
                      <span className="text-xs font-mono truncate">{file.path}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {Math.ceil((file.sizeBytes || file.content.length) / 1024)}KB
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Code Viewer / Editor (8 cols) */}
        <div className="md:col-span-8 flex flex-col bg-slate-950/90">
          {activeFile ? (
            <>
              {/* Code Viewer Header */}
              <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs font-mono font-bold text-white truncate">{activeFile.path}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                    {activeFile.language || 'text'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Updated by {activeFile.updatedBy}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Edit Button */}
                  {!isEditing ? (
                    <button
                      onClick={() => {
                        setEditContent(activeFile.content);
                        setIsEditing(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Edit File"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow transition"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                  )}

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Copy Code"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Download File"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteFile(activeFile.path)}
                    className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-900/60 text-red-400 hover:text-red-200 transition"
                    title="Delete File"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Code Content View / Edit Area */}
              <div className="flex-1 overflow-auto p-4 font-mono text-xs">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full p-3 rounded-xl bg-slate-900 border border-cyan-500/50 text-slate-100 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                  />
                ) : (
                  <div className="grid grid-cols-[auto,1fr] gap-4 text-slate-300 select-text">
                    {/* Line numbers */}
                    <div className="text-slate-600 text-right select-none font-mono text-[11px] pr-2 border-r border-slate-800">
                      {activeFile.content.split('\n').map((_, idx) => (
                        <div key={idx}>{idx + 1}</div>
                      ))}
                    </div>
                    {/* Code lines */}
                    <pre className="whitespace-pre overflow-x-auto text-[11px] font-mono leading-normal text-cyan-100/90">
                      {activeFile.content}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <Code2 className="h-10 w-10 text-slate-600" />
              <div className="text-xs">Select a file from the workspace tree to view source code</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

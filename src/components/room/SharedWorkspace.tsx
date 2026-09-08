'use client';

import React, { useState } from 'react';
import { WorkspaceItemDTO, SafetyEventDTO, VirtualFileDTO, TerminalLogDTO } from '@/types';
import {
  FolderTree,
  Code2,
  GitBranch,
  Terminal,
  CheckSquare,
  FileCode,
  Award,
  ShieldAlert,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Check,
  UserCheck,
  Eye,
  FolderArchive,
  GitCommit,
  Layers,
  Wrench,
} from 'lucide-react';
import CodeEditorView from '@/components/ide/CodeEditorView';
import DiffViewer from '@/components/ide/DiffViewer';
import SourceControlView from '@/components/ide/SourceControlView';
import LiveWebPreview from '@/components/ide/LiveWebPreview';
import ZipExporter from '@/components/ide/ZipExporter';
import GitGraphViewer from '@/components/ide/GitGraphViewer';
import WhiteboardCanvas from './WhiteboardCanvas';
import SelfHealingController from '@/components/ide/SelfHealingController';
import WebTerminal from './WebTerminal';
import { soundManager } from '@/lib/sound';

interface SharedWorkspaceProps {
  roomId: string;
  roomName?: string;
  workspaceItems: WorkspaceItemDTO[];
  safetyEvents: SafetyEventDTO[];
  virtualFiles?: VirtualFileDTO[];
  terminalLogs?: TerminalLogDTO[];
  isHost?: boolean;
  onFilesUpdated?: () => void;
  onTerminalExecuted?: () => void;
}

export default function SharedWorkspace({
  roomId,
  roomName = 'ZATA Agentic Workspace',
  workspaceItems,
  safetyEvents,
  virtualFiles = [],
  terminalLogs = [],
  isHost = false,
  onFilesUpdated,
  onTerminalExecuted,
}: SharedWorkspaceProps) {
  // Activity Rail Tab:
  // 'editor' | 'explorer' | 'preview' | 'git' | 'git_graph' | 'terminal' | 'whiteboard' | 'tools' | 'tasks' | 'decisions' | 'safety'
  const [activeActivity, setActiveActivity] = useState<
    | 'editor'
    | 'explorer'
    | 'preview'
    | 'git'
    | 'git_graph'
    | 'terminal'
    | 'whiteboard'
    | 'tools'
    | 'tasks'
    | 'decisions'
    | 'safety'
  >('editor');

  // Multi-file tabs management
  const initialPath = virtualFiles[0]?.path || 'README.md';
  const [openTabs, setOpenTabs] = useState<string[]>(
    virtualFiles.length > 0 ? virtualFiles.slice(0, 3).map((f) => f.path) : [initialPath]
  );
  const [activeFilePath, setActiveFilePath] = useState<string>(initialPath);
  const [isDiffActive, setIsDiffActive] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');

  // Task & decision states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);

  // New file creation modal state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  // Export Zip Modal (F81)
  const [isZipModalOpen, setIsZipModalOpen] = useState(false);

  // Extract task list item
  const taskListItem = workspaceItems.find((i) => i.key === 'task_list');
  const tasks: Array<{ id: string; title: string; status: 'todo' | 'in_progress' | 'done'; assignedTo?: string }> =
    Array.isArray(taskListItem?.value) ? (taskListItem.value as any) : [];

  // Extract scratchpad items
  const scratchpadItems = workspaceItems.filter((i) => i.key !== 'task_list' && i.key !== 'decision_log');

  // Extract decision log item
  const decisionItem = workspaceItems.find((i) => i.key === 'decision_log');
  const decisions: Array<{ id: string; title: string; rationale: string; by: string; timestamp: string }> =
    Array.isArray(decisionItem?.value) ? (decisionItem.value as any) : [];

  const handleActivityChange = (act: typeof activeActivity) => {
    soundManager.playClick();
    setActiveActivity(act);
  };

  const handleOpenFile = (path: string) => {
    soundManager.playClick();
    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [...prev, path]);
    }
    setActiveFilePath(path);
    setActiveActivity('editor');
    setIsDiffActive(false);
  };

  const handleCloseTab = (path: string) => {
    soundManager.playClick();
    const remaining = openTabs.filter((p) => p !== path);
    setOpenTabs(remaining);
    if (activeFilePath === path) {
      setActiveFilePath(remaining[remaining.length - 1] || '');
    }
  };

  const handleSaveFile = async (path: string, content: string) => {
    const ext = path.split('.').pop() || 'typescript';
    await fetch(`/api/rooms/${roomId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        content,
        language: ext,
        updatedBy: 'Human Director',
      }),
    });
    if (onFilesUpdated) onFilesUpdated();
  };

  const handleCreateFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    soundManager.playCheckpoint();
    const path = newFilePath.trim();
    const ext = path.split('.').pop() || 'typescript';

    try {
      await fetch(`/api/rooms/${roomId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          content: newFileContent || `// ${path}\n// Created in ZATA Agentic IDE\n`,
          language: ext,
          updatedBy: 'Human Director',
        }),
      });
      setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
      setActiveFilePath(path);
      setIsCreatingFile(false);
      setNewFilePath('');
      setNewFileContent('');
      setActiveActivity('editor');
      if (onFilesUpdated) onFilesUpdated();
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  };

  const handleDeleteFile = async (path: string) => {
    if (!confirm(`Delete virtual file "${path}" from workspace?`)) return;
    soundManager.playStop();
    try {
      await fetch(`/api/rooms/${roomId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, action: 'delete' }),
      });
      handleCloseTab(path);
      if (onFilesUpdated) onFilesUpdated();
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    soundManager.playClick();
    const nextStatusMap: Record<string, 'todo' | 'in_progress' | 'done'> = {
      todo: 'in_progress',
      in_progress: 'done',
      done: 'todo',
    };

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: nextStatusMap[t.status] || 'todo' };
      }
      return t;
    });

    try {
      await fetch(`/api/rooms/${roomId}/workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'task_list',
          title: 'Project Task Board',
          value: updatedTasks,
          itemType: 'task_list',
          updatedBy: 'Human Director',
        }),
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleAddNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isSavingTask) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'todo' as const,
      assignedTo: 'Human Director',
    };

    const updatedTasks = [...tasks, newTask];
    setIsSavingTask(true);
    soundManager.playCheckpoint();
    try {
      await fetch(`/api/rooms/${roomId}/workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'task_list',
          title: 'Project Task Board',
          value: updatedTasks,
          itemType: 'task_list',
          updatedBy: 'Human Director',
        }),
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setIsSavingTask(false);
    }
  };

  const filteredFiles = virtualFiles.filter((f) =>
    f.path.toLowerCase().includes(fileSearchQuery.toLowerCase())
  );

  const activeFile = virtualFiles.find((f) => f.path === activeFilePath) || virtualFiles[0];

  return (
    <div className="flex h-full bg-[#08040a] rounded-2xl border border-rose-950/60 overflow-hidden shadow-2xl">
      {/* 1. VS Code / GitHub Activity Rail (Leftmost Icon Bar) */}
      <div className="w-12 bg-[#0d0512] border-r border-rose-950/50 flex flex-col items-center py-3 gap-2.5 select-none shrink-0 justify-between">
        <div className="flex flex-col items-center gap-2.5">
          {[
            { id: 'editor', icon: Code2, label: 'Code Editor' },
            { id: 'explorer', icon: FolderTree, label: `Explorer (${virtualFiles.length})` },
            { id: 'preview', icon: Eye, label: 'Live Web Preview (F85)' },
            { id: 'git', icon: GitBranch, label: 'Source Control (Git)' },
            { id: 'git_graph', icon: GitCommit, label: 'Git Graph Tree (F31)' },
            { id: 'terminal', icon: Terminal, label: 'Integrated Terminal' },
            { id: 'whiteboard', icon: Layers, label: 'Whiteboard Canvas (F65)' },
            { id: 'tools', icon: Wrench, label: 'Self-Healing & AI Tools (F91-100)' },
            { id: 'tasks', icon: CheckSquare, label: `Tasks (${tasks.length})` },
            { id: 'decisions', icon: Award, label: `Decisions (${decisions.length})` },
            { id: 'safety', icon: ShieldAlert, label: `Safety Audit (${safetyEvents.length})` },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeActivity === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleActivityChange(item.id as any)}
                className={`p-2 rounded-xl transition-all relative group ${
                  isActive
                    ? 'bg-rose-950/90 text-rose-300 border border-rose-600/70 shadow-lg shadow-rose-950/80'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
                title={item.label}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-rose-500 rounded-r" />
                )}
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {/* F81: Bottom Action: One-Click ZIP Downloader Hub */}
        <button
          onClick={() => {
            soundManager.playCheckpoint();
            setIsZipModalOpen(true);
          }}
          className="p-2 rounded-xl bg-[#140719] border border-rose-950 hover:border-rose-600 text-rose-400 hover:text-white transition shadow-sm"
          title="Export Workspace Bundle (.zip / Docker / CI) (F81)"
        >
          <FolderArchive className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Main Workbench Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* VIEW 1: CODE EDITOR + DIFF VIEW */}
        {activeActivity === 'editor' && (
          <div className="h-full">
            {isDiffActive && activeFile ? (
              <DiffViewer
                fileName={activeFile.name}
                originalContent={`// Original baseline from repository\n${activeFile.content.split('\n').slice(0, 5).join('\n')}\n// ...`}
                modifiedContent={activeFile.content}
                onClose={() => setIsDiffActive(false)}
              />
            ) : (
              <CodeEditorView
                files={virtualFiles}
                activeFilePath={activeFilePath}
                openTabs={openTabs}
                onSelectTab={handleOpenFile}
                onCloseTab={handleCloseTab}
                onSaveFile={handleSaveFile}
                onToggleDiff={() => setIsDiffActive(!isDiffActive)}
                isDiffActive={isDiffActive}
                isHost={isHost}
              />
            )}
          </div>
        )}

        {/* VIEW 2: FULL EXPLORER (File Tree & Creation) */}
        {activeActivity === 'explorer' && (
          <div className="flex flex-col h-full bg-[#0a050d] p-4 font-mono text-xs overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-950/50">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-rose-400" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Workspace Explorer ({virtualFiles.length} files)
                </span>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsCreatingFile(!isCreatingFile);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold flex items-center gap-1 transition shadow-md shadow-rose-600/25"
              >
                <Plus className="h-3 w-3" />
                <span>New File</span>
              </button>
            </div>

            {/* Inline New File Form */}
            {isCreatingFile && (
              <form onSubmit={handleCreateFileSubmit} className="p-3 bg-[#130819] border border-rose-800/60 rounded-xl space-y-2 animate-in fade-in">
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  placeholder="e.g. src/routes/auth.ts or docs/API.md"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#070309] border border-rose-950 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                  autoFocus
                  required
                />
                <textarea
                  rows={3}
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="// Initial file content..."
                  className="w-full p-2.5 rounded-lg bg-[#070309] border border-rose-950 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFile(false)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Search Files */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={fileSearchQuery}
                onChange={(e) => setFileSearchQuery(e.target.value)}
                placeholder="Filter files..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#110716] border border-rose-950 text-xs text-rose-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Files List */}
            <div className="space-y-1">
              {filteredFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => handleOpenFile(file.path)}
                  className="group px-3 py-2 rounded-xl bg-[#120718]/60 hover:bg-rose-950/50 border border-rose-950/30 hover:border-rose-800/50 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    <span className="truncate text-slate-200 group-hover:text-white">{file.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      {Math.ceil((file.sizeBytes || file.content.length) / 1024)}KB
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.path);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1"
                      title="Delete file"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: LIVE WEB PREVIEW (F85) */}
        {activeActivity === 'preview' && (
          <div className="h-full">
            <LiveWebPreview
              files={virtualFiles}
              activeFilePath={activeFilePath}
              onSelectFile={handleOpenFile}
            />
          </div>
        )}

        {/* VIEW 4: GIT SOURCE CONTROL */}
        {activeActivity === 'git' && (
          <div className="h-full">
            <SourceControlView
              roomId={roomId}
              files={virtualFiles}
              onCommitSuccess={onFilesUpdated}
              isHost={isHost}
            />
          </div>
        )}

        {/* VIEW 5: GIT GRAPH TREE (F31) */}
        {activeActivity === 'git_graph' && (
          <div className="h-full">
            <GitGraphViewer roomId={roomId} />
          </div>
        )}

        {/* VIEW 6: INTEGRATED TERMINAL */}
        {activeActivity === 'terminal' && (
          <div className="h-full">
            <WebTerminal
              roomId={roomId}
              logs={terminalLogs}
              onCommandExecuted={onTerminalExecuted}
              isHost={isHost}
            />
          </div>
        )}

        {/* VIEW 7: ARCHITECTURE WHITEBOARD CANVAS (F65) */}
        {activeActivity === 'whiteboard' && (
          <div className="h-full">
            <WhiteboardCanvas roomId={roomId} />
          </div>
        )}

        {/* VIEW 8: SELF-HEALING & AI DEVELOPER TOOLS (F91-F100) */}
        {activeActivity === 'tools' && (
          <div className="h-full">
            <SelfHealingController
              roomId={roomId}
              files={virtualFiles}
              logs={terminalLogs}
              onApplyFix={handleSaveFile}
              onRunTestCommand={async () => {
                await fetch(`/api/rooms/${roomId}/terminal`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: 'npm test', executedBy: 'Self-Healing Engine' }),
                });
                if (onTerminalExecuted) onTerminalExecuted();
              }}
            />
          </div>
        )}

        {/* VIEW 9: TASK BOARD */}
        {activeActivity === 'tasks' && (
          <div className="p-4 h-full overflow-y-auto space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-rose-950/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Shared Autonomous Task Board
                </span>
                <p className="text-[10px] text-slate-500">Click status badge to advance (todo &rarr; in_progress &rarr; done)</p>
              </div>
              <button
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition"
              >
                <Plus className="h-3 w-3" />
                <span>Add Task</span>
              </button>
            </div>

            {isAddingTask && (
              <form onSubmit={handleAddNewTask} className="p-3 rounded-xl bg-[#130819] border border-rose-800/60 space-y-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title (e.g. Implement rate limiter middleware)..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#070309] border border-rose-950 text-white text-xs focus:outline-none focus:border-rose-500"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim() || isSavingTask}
                    className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold disabled:opacity-40"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {tasks.map((t) => {
                const badge = {
                  todo: 'bg-slate-900 text-slate-400 border-slate-800',
                  in_progress: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
                  done: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
                }[t.status];

                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-[#120718]/70 border border-rose-950/40 flex items-start justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className={`text-xs ${t.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {t.title}
                      </p>
                      {t.assignedTo && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <UserCheck className="h-3 w-3 text-rose-400" />
                          <span>Assigned: {t.assignedTo}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleTaskStatus(t.id)}
                      className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border transition ${badge}`}
                    >
                      {t.status.replace('_', ' ')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 10: CONSENSUS DECISION LOG */}
        {activeActivity === 'decisions' && (
          <div className="p-4 h-full overflow-y-auto space-y-3 font-mono text-xs">
            <div className="pb-2 border-b border-rose-950/50 text-xs font-bold uppercase tracking-wider text-rose-300">
              Consensus &amp; Agreement Log
            </div>
            {decisions.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No formal consensus recorded yet.</p>
            ) : (
              decisions.map((d) => (
                <div key={d.id} className="p-3 rounded-xl bg-[#120718]/80 border border-rose-950/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">{d.title}</span>
                    <span className="text-[10px] text-slate-500">by {d.by}</span>
                  </div>
                  <p className="text-slate-300 text-xs">{d.rationale}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW 11: SAFETY AUDIT LOG */}
        {activeActivity === 'safety' && (
          <div className="p-4 h-full overflow-y-auto space-y-3 font-mono text-xs">
            <div className="pb-2 border-b border-rose-950/50 text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              <span>Anti-Infinite-Loop Safety Audit Trail</span>
            </div>
            {safetyEvents.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No safety halts recorded. Session running smoothly.</p>
            ) : (
              safetyEvents.map((evt) => (
                <div key={evt.id} className="p-3 rounded-xl bg-red-950/30 border border-red-900/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-red-400">{evt.type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Turn #{evt.turn}</span>
                  </div>
                  <p className="text-slate-300 text-xs">{evt.detail}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* F81 ZIP Exporter Modal */}
      <ZipExporter
        roomName={roomName}
        files={virtualFiles}
        isOpen={isZipModalOpen}
        onClose={() => setIsZipModalOpen(false)}
      />
    </div>
  );
}

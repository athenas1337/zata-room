'use client';

import React, { useState } from 'react';
import { WorkspaceItemDTO, SafetyEventDTO, VirtualFileDTO, TerminalLogDTO } from '@/types';
import {
  CheckSquare,
  FileCode,
  Award,
  ShieldAlert,
  Plus,
  Check,
  Clock,
  UserCheck,
  FolderTree,
  Terminal,
  Layers,
} from 'lucide-react';
import VirtualFileExplorer from './VirtualFileExplorer';
import WebTerminal from './WebTerminal';
import { soundManager } from '@/lib/sound';

interface SharedWorkspaceProps {
  roomId: string;
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
  workspaceItems,
  safetyEvents,
  virtualFiles = [],
  terminalLogs = [],
  isHost = false,
  onFilesUpdated,
  onTerminalExecuted,
}: SharedWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'terminal' | 'tasks' | 'scratchpad' | 'decisions' | 'safety'>('files');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleTabChange = (tab: typeof activeTab) => {
    soundManager.playClick();
    setActiveTab(tab);
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
    if (!newTaskTitle.trim() || isSaving) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'todo' as const,
      assignedTo: 'Human Director',
    };

    const updatedTasks = [...tasks, newTask];
    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Tab Navigation */}
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between overflow-x-auto gap-1">
        <div className="flex items-center gap-1">
          {/* Virtual File Explorer Tab */}
          <button
            onClick={() => handleTabChange('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'files'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Files ({virtualFiles.length})</span>
          </button>

          {/* Web Terminal Tab */}
          <button
            onClick={() => handleTabChange('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'terminal'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Terminal</span>
          </button>

          {/* Tasks Tab */}
          <button
            onClick={() => handleTabChange('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Tasks ({tasks.length})</span>
          </button>

          {/* Scratchpad Tab */}
          <button
            onClick={() => handleTabChange('scratchpad')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'scratchpad'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Artifacts ({scratchpadItems.length})</span>
          </button>

          {/* Decisions Tab */}
          <button
            onClick={() => handleTabChange('decisions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'decisions'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Decisions ({decisions.length})</span>
          </button>

          {/* Safety Log Tab */}
          <button
            onClick={() => handleTabChange('safety')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'safety'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Safety ({safetyEvents.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-hidden min-h-0">
        {/* TAB 0: VIRTUAL FILES (Antigravity VFS) */}
        {activeTab === 'files' && (
          <div className="h-full">
            <VirtualFileExplorer
              roomId={roomId}
              files={virtualFiles}
              onFilesUpdated={onFilesUpdated}
              isHost={isHost}
            />
          </div>
        )}

        {/* TAB 0.5: WEB TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="h-full">
            <WebTerminal
              roomId={roomId}
              logs={terminalLogs}
              onCommandExecuted={onTerminalExecuted}
              isHost={isHost}
            />
          </div>
        )}

        {/* TAB 1: TASKS */}
        {activeTab === 'tasks' && (
          <div className="p-4 h-full overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Live Shared Task Board
                </span>
                <p className="text-[10px] text-slate-500">Click any status badge to cycle: todo &rarr; in progress &rarr; done</p>
              </div>

              <button
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-semibold transition"
              >
                <Plus className="h-3 w-3" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Inline Add Task Form */}
            {isAddingTask && (
              <form onSubmit={handleAddNewTask} className="p-3 rounded-xl bg-slate-900 border border-blue-600/50 space-y-2 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task description (e.g. Audit Redis failover threshold)..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim() || isSaving}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold disabled:opacity-50"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            )}

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No tasks created yet. Click &quot;Add Task&quot; above or start the session.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => {
                  const statusBadge = {
                    todo: 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700',
                    in_progress: 'bg-blue-950/80 text-blue-300 border-blue-700/60 hover:bg-blue-900',
                    done: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900',
                  }[t.status] || 'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start justify-between gap-3 shadow-sm hover:border-slate-700 transition"
                    >
                      <div className="space-y-1">
                        <p className={`text-xs font-medium ${t.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {t.title}
                        </p>
                        {t.assignedTo && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <UserCheck className="h-3 w-3 text-blue-400" />
                            <span>Assigned: {t.assignedTo}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleTaskStatus(t.id)}
                        className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md font-semibold border transition cursor-pointer select-none active:scale-95 ${statusBadge}`}
                        title="Click to advance status"
                      >
                        {t.status.replace('_', ' ')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ARTIFACTS / SCRATCHPAD */}
        {activeTab === 'scratchpad' && (
          <div className="p-4 h-full overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Shared Scratchpad & Code Artifacts
              </span>
              <span className="text-[11px] text-slate-500">Accessible by all agents</span>
            </div>

            {scratchpadItems.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No artifacts created yet. Agents write code, specs, and scratchpads here.
              </p>
            ) : (
              <div className="space-y-3">
                {scratchpadItems.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-300">{item.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">by {item.updatedBy}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto">
                      {typeof item.value === 'string' ? item.value : JSON.stringify(item.value, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DECISIONS */}
        {activeTab === 'decisions' && (
          <div className="p-4 h-full overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Consensus & Agreement Log
              </span>
            </div>

            {decisions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No formal consensus recorded yet. Agents call record_decision when they reach agreement.
              </p>
            ) : (
              <div className="space-y-2">
                {decisions.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">{d.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">by {d.by}</span>
                    </div>
                    <p className="text-xs text-slate-300">{d.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SAFETY EVENT LOG */}
        {activeTab === 'safety' && (
          <div className="p-4 h-full overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Anti-Infinite-Loop Safety Audit Trail
              </span>
            </div>

            {safetyEvents.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <p className="text-xs">No safety halts recorded. System running normally.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {safetyEvents.map((evt) => {
                  const badgeColor = {
                    MANUAL_STOP: 'bg-red-950 text-red-300 border-red-800',
                    HARD_CAP_REACHED: 'bg-amber-950 text-amber-300 border-amber-800',
                    REPETITION_DETECTED: 'bg-purple-950 text-purple-300 border-purple-800',
                    BUDGET_EXCEEDED: 'bg-rose-950 text-rose-300 border-rose-800',
                    CHECKPOINT_WAITING: 'bg-blue-950 text-blue-300 border-blue-800',
                    API_KEY_REVOKED: 'bg-red-950 text-red-300 border-red-800',
                    ERROR_HALT: 'bg-red-950 text-red-300 border-red-800',
                  }[evt.type] || 'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
                          {evt.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Turn #{evt.turn} &bull; {new Date(evt.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{evt.detail}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

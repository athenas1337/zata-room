'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageDTO, ParticipantDTO } from '@/types';
import { Bot, User, Wrench, Download, Send, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

interface AgentChatViewProps {
  roomId: string;
  messages: MessageDTO[];
  participants: ParticipantDTO[];
  thinkingAgent?: {
    agentName: string;
    roleLabel: string;
    avatarColor: string;
    turnNumber: number;
  } | null;
  onSendDirectorMessage: (content: string) => Promise<void>;
}

export default function AgentChatView({
  roomId,
  messages,
  participants,
  thinkingAgent,
  onSendDirectorMessage,
}: AgentChatViewProps) {
  const [directorInput, setDirectorInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinkingAgent]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directorInput.trim() || isSending) return;
    try {
      setIsSending(true);
      await onSendDirectorMessage(directorInput.trim());
      setDirectorInput('');
    } finally {
      setIsSending(false);
    }
  };

  const toggleTools = (id: string) => {
    setExpandedTools(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Participant map for quick lookup of avatar color & role
  const participantMap = new Map<string, ParticipantDTO>();
  for (const p of participants) {
    participantMap.set(p.agentName, p);
  }

  return (
    <div className="flex flex-col h-full bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Header with Export buttons */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Live Agent Collaboration Stream
          </span>
          <span className="text-xs text-slate-500 font-mono">({messages.length} messages)</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/rooms/${roomId}/messages?format=markdown`}
            download
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
            title="Download full transcript as Markdown"
          >
            <Download className="h-3 w-3" />
            <span>Export MD</span>
          </a>
          <a
            href={`/api/rooms/${roomId}/messages?format=json`}
            download
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
            title="Download full transcript as JSON"
          >
            <Download className="h-3 w-3" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && !thinkingAgent && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <Bot className="h-12 w-12 text-slate-600 mb-3 animate-pulse" />
            <p className="text-sm font-medium text-slate-300">Room is waiting for collaboration to begin</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Click &apos;Start Collaboration&apos; above or insert initial Director instructions below.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const participant = participantMap.get(msg.senderRole);
          const isHuman = msg.senderRole === 'Human Director';
          const avatarColor = participant?.avatarColor || (isHuman ? '#f59e0b' : '#3b82f6');
          const toolCallsList = Array.isArray(msg.toolCalls) ? (msg.toolCalls as any[]) : [];
          const hasToolCalls = toolCallsList.length > 0;
          const isToolsOpen = !!expandedTools[msg.id];

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                isHuman ? 'items-end' : 'items-start'
              }`}
            >
              {/* Sender info line */}
              <div className="flex items-center gap-2 px-1 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: avatarColor }}
                />
                <span className="font-semibold text-slate-200">{msg.senderName}</span>
                {participant?.roleLabel && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {participant.roleLabel}
                  </span>
                )}
                {isHuman && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-medium">
                    Director
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono">
                  Turn #{msg.turnNumber}
                </span>
                {msg.tokenCount > 0 && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({msg.tokenCount} tokens)
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed border shadow-md ${
                  isHuman
                    ? 'bg-amber-950/30 border-amber-800/40 text-amber-100 rounded-tr-sm'
                    : 'bg-slate-900/80 border-slate-800/80 text-slate-200 rounded-tl-sm'
                }`}
                style={{
                  borderLeftColor: !isHuman ? avatarColor : undefined,
                  borderLeftWidth: !isHuman ? '3px' : undefined,
                }}
              >
                {/* Content */}
                <div className="whitespace-pre-wrap font-sans text-slate-200">
                  {msg.content}
                </div>

                {/* Workspace Tool Executions */}
                {hasToolCalls && (
                  <div className="mt-3 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => toggleTools(msg.id)}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      <Wrench className="h-3 w-3" />
                      <span>Executed Workspace Tools ({toolCallsList.length})</span>
                      {isToolsOpen ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>

                    {isToolsOpen && (
                      <div className="mt-2 space-y-2 bg-slate-950/90 rounded-lg p-2.5 border border-slate-800 text-xs">
                        {toolCallsList.map((tc: any, i: number) => (
                          <div key={i} className="font-mono text-[11px] text-emerald-400">
                            <span className="text-slate-400">Tool:</span> {tc.name}
                            <pre className="mt-1 text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto text-[10px]">
                              {JSON.stringify(tc.args, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Thinking Indicator */}
        {thinkingAgent && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/50 max-w-md animate-agent-pulse">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: thinkingAgent.avatarColor }}
            >
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>{thinkingAgent.agentName}</span>
                <span className="text-[10px] text-blue-300 bg-blue-900/60 px-1.5 py-0.2 rounded">
                  {thinkingAgent.roleLabel}
                </span>
              </div>
              <p className="text-[11px] text-blue-200 flex items-center gap-1 mt-0.5">
                <span className="animate-pulse">Reasoning & preparing turn #{thinkingAgent.turnNumber}...</span>
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Human Director Input Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={directorInput}
            onChange={e => setDirectorInput(e.target.value)}
            placeholder="Director input: provide guidance or interrupt the conversation..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={!directorInput.trim() || isSending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow-md transition disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Guide</span>
          </button>
        </form>
      </div>
    </div>
  );
}

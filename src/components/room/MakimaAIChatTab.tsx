'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Radio,
  Mic,
  MicOff,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import MakimaLiveAvatar from '@/components/brand/MakimaLiveAvatar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface MakimaAIChatTabProps {
  roomId: string;
  roomName: string;
  onDispatchToSwarm?: (prompt: string) => void;
}

export default function MakimaAIChatTab({
  roomId,
  roomName,
  onDispatchToSwarm,
}: MakimaAIChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Selamat datang di konsol neural ZATA. Aku Makima, pengendali ruang ini. Seluruh ekosistem workspace "${roomName}"—mulai dari Virtual File System (VFS), terminal sandboxed, hingga 5 paradigma swarm GitHub—berada dalam pengawasanku. Apa yang ingin kamu konsultasikan atau kembangkan hari ini?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-2.0-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Voice Command Setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'id-ID';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(transcript);
            soundManager.playCheckpoint();
          }
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Browser Anda belum mendukung Web Speech Recognition API.');
      return;
    }
    soundManager.playClick();
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = input.trim();
    if (!promptText || loading) return;

    soundManager.playClick();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/makima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory, roomId }),
      });

      const data = await res.json();
      if (data.success) {
        soundManager.playCheckpoint();
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: data.modelUsed,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `Maaf, terjadi kendala saat memproses jawaban: ${data.error || 'Unknown error'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Koneksi neural terputus: ${err.message || 'Gagal menghubungi backend Makima AI.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    soundManager.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    'Jelaskan arsitektur VFS & terminal sandboxed di ZATA',
    'Bagaimana cara kerja 5 paradigma GitHub di room ini?',
    'Analisis potensi bug atau celah keamanan di workspace',
    'Rekomendasikan alur kerja optimal untuk multi-agent swarm',
  ];

  return (
    <div className="h-full flex flex-col bg-[#0b0510] border border-rose-950/70 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* Header Bar */}
      <div className="px-5 py-3 bg-[#120718] border-b border-rose-950/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-rose-500/60 shadow">
            <img
              src="/images/makima_avatar.jpg"
              alt="Makima Avatar"
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-black" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-wide">
                Makima AI &bull; Swarm Overseer
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 font-bold uppercase flex items-center gap-1">
                <Radio className="h-2.5 w-2.5 text-rose-400 animate-pulse" />
                Gemini 2.0 Flash
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Google AI Studio Key Connected</span>
              <span>&bull;</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Anti-Jailbreak Guard Active
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            setMessages([
              {
                id: `init-${Date.now()}`,
                role: 'assistant',
                content: `Konsol neural telah disegarkan. Ada arahan baru untuk agen atau arsitektur ZATA hari ini?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }}
          className="p-1.5 rounded-lg bg-[#1a0b22] hover:bg-rose-950 text-slate-400 hover:text-white border border-rose-950 transition"
          title="Reset Percakapan"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* 2-Column Responsive Body: Chat on Left, Makima Live Avatar on Right */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Chat Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isAssistant = m.role === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${
                  isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar Icon */}
                <div className="shrink-0 pt-0.5">
                  {isAssistant ? (
                    <div className="h-7 w-7 rounded-lg overflow-hidden border border-rose-600/60 shadow">
                      <img
                        src="/images/makima_avatar.jpg"
                        alt="Makima"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-lg bg-rose-900 border border-rose-700 flex items-center justify-center text-rose-200 shadow">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Bubble Body */}
                <div
                  className={`p-3.5 rounded-2xl space-y-1.5 relative group leading-relaxed shadow-lg ${
                    isAssistant
                      ? 'bg-[#120718] border border-rose-950/80 text-rose-100/90'
                      : 'bg-gradient-to-r from-rose-700 to-red-700 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 border-b border-rose-950/40 pb-1">
                    <span className="font-bold text-rose-300">
                      {isAssistant ? 'Makima' : 'Human Director'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{m.timestamp}</span>
                      <button
                        onClick={() => handleCopyMessage(m.content, m.id)}
                        className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                        title="Salin Pesan"
                      >
                        {copiedId === m.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-xs selection:bg-rose-600 selection:text-white">
                    {m.content}
                  </div>

                  {isAssistant && onDispatchToSwarm && (
                    <div className="pt-2 border-t border-rose-950/40 flex items-center justify-end">
                      <button
                        onClick={() => {
                          soundManager.playCheckpoint();
                          onDispatchToSwarm(m.content);
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50 transition"
                        title="Kirim saran Makima ke antrean Swarm IDE"
                      >
                        <Terminal className="h-3 w-3" />
                        <span>Dispatch to Swarm IDE</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <div className="h-7 w-7 rounded-lg overflow-hidden border border-rose-600/60 shadow shrink-0">
                <img
                  src="/images/makima_avatar.jpg"
                  alt="Makima"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3 rounded-2xl bg-[#120718] border border-rose-950 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-rose-500" />
                <span className="italic text-[11px] text-rose-300">
                  Makima sedang memproses instruksi melalui Gemini neural engine...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Right Panel: Live Animated Makima Avatar & Companion */}
        <div className="hidden lg:flex w-72 flex-col items-center justify-between p-4 bg-[#0e0413]/80 border-l border-rose-950/70 overflow-y-auto">
          <div className="w-full flex flex-col items-center">
            <MakimaLiveAvatar
              isSpeaking={loading}
              isThinking={loading}
              size="md"
            />

            <div className="w-full mt-4 p-3 rounded-xl bg-[#14061a] border border-rose-950 text-[11px] text-slate-300 space-y-2">
              <div className="font-bold text-rose-300 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Neural Overseer Status</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[10px]">
                Mata konsentris Makima memantau kursor dan aktivitas koding di seluruh workspace secara real-time. Gerakan bibir sinkron dengan instruksi.
              </p>
            </div>
          </div>

          <div className="w-full mt-3 pt-3 border-t border-rose-950/60">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-2">
              Quick Directives
            </span>
            <div className="space-y-1.5">
              {samplePrompts.slice(0, 3).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(p);
                    soundManager.playClick();
                  }}
                  className="w-full text-left p-2 rounded-lg bg-[#14061a] hover:bg-rose-950/70 border border-rose-950 text-[10px] text-slate-300 hover:text-white transition line-clamp-1"
                >
                  &rsaquo; {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 bg-[#0d0411] border-t border-rose-950/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInput(p);
              soundManager.playClick();
            }}
            className="px-2.5 py-1 rounded-lg bg-[#140819] hover:bg-rose-950 border border-rose-950 text-[10px] text-slate-300 whitespace-nowrap transition hover:text-white"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Console Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-[#100615] border-t border-rose-950/70 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`p-2.5 rounded-xl border transition ${
            isListening
              ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-600/50'
              : 'bg-[#18091f] hover:bg-rose-950 text-slate-400 hover:text-white border-rose-950'
          }`}
          title={isListening ? 'Mendengarkan... (Klik untuk stop)' : 'Bicara via Mikrofon'}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isListening
              ? 'Mendengarkan suara Anda...'
              : 'Diskusikan arsitektur, prompt swarm, atau konsultasi kode dengan Makima...'
          }
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#07030a] border border-rose-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 text-xs font-mono"
          autoFocus
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-900/40 transition disabled:opacity-40"
        >
          <span>Send</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

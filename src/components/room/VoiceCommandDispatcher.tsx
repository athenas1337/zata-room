'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Radio, Send, CheckCircle2 } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface VoiceCommandDispatcherProps {
  onDispatchDirective: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceCommandDispatcher({
  onDispatchDirective,
  disabled = false,
}: VoiceCommandDispatcherProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastDispatched, setLastDispatched] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleToggleMic = () => {
    if (disabled) return;
    if (!recognitionRef.current) {
      alert('Browser belum mendukung Web Speech Recognition. Gunakan Google Chrome atau Edge.');
      return;
    }

    soundManager.playClick();
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleDispatch = () => {
    if (!transcript.trim()) return;
    soundManager.playCheckpoint();
    onDispatchDirective(transcript.trim());
    setLastDispatched(transcript.trim());
    setTranscript('');
    setIsListening(false);

    // Audio feedback response
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Perintah diterima. Mengarahkan agen.');
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    }

    setTimeout(() => setLastDispatched(null), 3000);
  };

  return (
    <div className="p-3 rounded-2xl bg-[#120718] border border-rose-950/80 shadow-xl font-mono text-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-bold text-white text-xs">Hands-Free Voice Dispatcher</span>
        </div>
        <span className="text-[10px] text-slate-400">Web Speech API</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleMic}
          className={`p-2.5 rounded-xl border transition flex items-center justify-center shrink-0 ${
            isListening
              ? 'bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-600/50'
              : 'bg-[#1a0b22] hover:bg-rose-950 text-rose-300 border-rose-950'
          }`}
          title={isListening ? 'Stop Listening' : 'Bicara untuk mendiktekan perintah'}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={isListening ? 'Mendengarkan ucapan Anda...' : 'Tekan mic untuk berbicara atau ketik arahan...'}
          className="flex-1 px-3 py-2 rounded-xl bg-[#08030b] border border-rose-950 text-rose-100 text-xs focus:outline-none focus:border-rose-600"
        />

        <button
          type="button"
          onClick={handleDispatch}
          disabled={!transcript.trim()}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center gap-1 shadow transition disabled:opacity-40 shrink-0"
        >
          <span>Dispatch</span>
          <Send className="h-3 w-3" />
        </button>
      </div>

      {lastDispatched && (
        <div className="text-[10px] text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>Dispatched: &quot;{lastDispatched}&quot;</span>
        </div>
      )}
    </div>
  );
}

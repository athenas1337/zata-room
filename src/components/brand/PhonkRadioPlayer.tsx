'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Keyboard,
  Sparkles,
  Palette,
  Check,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface Track {
  id: string;
  name: string;
  bpm: number;
  genre: string;
}

const TRACKS: Track[] = [
  { id: 'track1', name: 'Makima Velvet Phonk', bpm: 130, genre: 'Drift Phonk' },
  { id: 'track2', name: 'Tokyo Obsidian Lo-Fi', bpm: 92, genre: 'Cyber Chillhop' },
  { id: 'track3', name: 'Control Devil Bass', bpm: 138, genre: 'Dark Wave' },
];

const THEMES = [
  { id: 'velvet', name: 'Blood Velvet', primary: '#f43f5e', bg: '#08040a' },
  { id: 'noir', name: 'Obsidian Noir', primary: '#a855f7', bg: '#060209' },
  { id: 'gold', name: 'Chainsaw Gold', primary: '#f59e0b', bg: '#080602' },
  { id: 'mono', name: 'Monochrome', primary: '#e2e8f0', bg: '#030303' },
];

export default function PhonkRadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0]);
  const [activeStep, setActiveStep] = useState(0);
  const [isKeySoundOn, setIsKeySoundOn] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('velvet');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsKeySoundOn(soundManager.isKeySoundEnabled());
  }, []);

  // Audio-reactive visualizer canvas (F41)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 16;
      const barWidth = canvas.width / bars - 1;

      for (let i = 0; i < bars; i++) {
        let h = 3;
        if (isPlaying) {
          // React to active step
          const dist = Math.abs((activeStep % bars) - i);
          const energy = dist === 0 ? 1 : dist === 1 ? 0.7 : 0.25;
          h = Math.max(3, Math.sin(Date.now() * 0.008 + i) * 8 * energy + 10 * energy);
        }

        ctx.fillStyle = i === activeStep ? '#f43f5e' : '#be123c';
        ctx.fillRect(i * (barWidth + 1), canvas.height - h, barWidth, h);
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, activeStep]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      soundManager.stopPhonkRadio();
      setIsPlaying(false);
    } else {
      soundManager.startPhonkRadio(currentTrack.bpm, (step) => {
        setActiveStep(step);
      });
      setIsPlaying(true);
    }
  };

  const handleSelectTrack = (track: Track) => {
    soundManager.playClick();
    setCurrentTrack(track);
    if (isPlaying) {
      soundManager.startPhonkRadio(track.bpm, (step) => {
        setActiveStep(step);
      });
    }
  };

  const handleToggleKeySound = () => {
    const next = soundManager.toggleKeySound();
    setIsKeySoundOn(next);
    if (next) soundManager.playKeyClick('cyber');
  };

  const handleSelectTheme = (themeId: string) => {
    soundManager.playClick();
    setCurrentTheme(themeId);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  };

  return (
    <div className="relative font-mono text-xs select-none">
      {/* Mini Radio Bar */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#110617]/90 border border-rose-950/80 shadow-md backdrop-blur-md">
        <button
          onClick={handleTogglePlay}
          className={`p-1.5 rounded-lg transition ${
            isPlaying
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 animate-pulse'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
          title={isPlaying ? 'Pause Phonk Radio' : 'Play Phonk Radio'}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>

        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer flex items-center gap-2 group"
          title="Click to open radio tracklist & theme settings"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[11px] font-bold text-white group-hover:text-rose-300 transition">
                {currentTrack.name}
              </span>
            </div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
              {currentTrack.genre} • {currentTrack.bpm} BPM
            </span>
          </div>

          {/* Mini Waveform Canvas */}
          <canvas ref={canvasRef} width={64} height={18} className="rounded bg-[#08020b]" />
        </div>

        {/* Mechanical Keyboard Feedback Button (F47) */}
        <button
          onClick={handleToggleKeySound}
          className={`p-1.5 rounded-lg border transition ${
            isKeySoundOn
              ? 'bg-purple-950/80 border-purple-700/80 text-purple-300'
              : 'bg-slate-900/50 border-slate-800/80 text-slate-500 hover:text-slate-300'
          }`}
          title={`Mechanical Keyboard Audio Feedback: ${isKeySoundOn ? 'ON' : 'OFF'}`}
        >
          <Keyboard className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded Tracklist & Makima Presets Popover */}
      {isExpanded && (
        <div className="absolute right-0 top-12 z-50 w-72 p-3 bg-[#0d0413] border border-rose-900/80 rounded-2xl shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-rose-950/60 text-slate-300 font-bold text-[11px]">
            <div className="flex items-center gap-1.5 text-rose-400">
              <Music className="h-3.5 w-3.5" />
              <span>Makima Cyber Radio</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          {/* Track list */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Stations:</span>
            {TRACKS.map((t) => (
              <div
                key={t.id}
                onClick={() => handleSelectTrack(t)}
                className={`p-2 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  currentTrack.id === t.id
                    ? 'bg-rose-950/80 border-rose-700 text-rose-200 shadow'
                    : 'bg-[#120718] border-rose-950/50 text-slate-400 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">{t.name}</div>
                  <span className="text-[9px] text-slate-500">{t.genre} • {t.bpm} BPM</span>
                </div>
                {currentTrack.id === t.id && <Check className="h-3.5 w-3.5 text-rose-400" />}
              </div>
            ))}
          </div>

          {/* F48 Theme Presets */}
          <div className="space-y-1.5 pt-1 border-t border-rose-950/60">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Palette className="h-3 w-3 text-rose-400" />
              <span>Makima Cyber Themes (F48):</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 transition ${
                    currentTheme === theme.id
                      ? 'border-rose-500 bg-rose-950/60 text-white'
                      : 'border-slate-800 bg-[#120718] text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

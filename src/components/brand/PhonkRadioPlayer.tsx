'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Music,
  Keyboard,
  Sparkles,
  Palette,
  Check,
  Flame,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface Track {
  id: string;
  name: string;
  bpm: number;
  genre: string;
  style: 'tiktok_drift' | 'tokyo_night' | 'makima_velvet';
}

const TRACKS: Track[] = [
  { id: 'track1', name: 'TikTok Viral Drift Phonk (Cowbell)', bpm: 140, genre: 'Viral Cowbell Phonk', style: 'tiktok_drift' },
  { id: 'track2', name: 'Tokyo Obsidian Night Drive', bpm: 134, genre: 'Dark Wave Phonk', style: 'tokyo_night' },
  { id: 'track3', name: 'Makima Velvet Chillhop', bpm: 92, genre: 'Lo-Fi Chillhop', style: 'makima_velvet' },
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
          const dist = Math.abs((activeStep % bars) - i);
          const energy = dist === 0 ? 1 : dist === 1 ? 0.75 : 0.25;
          h = Math.max(3, Math.sin(Date.now() * 0.012 + i) * 7 * energy + 11 * energy);
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
      soundManager.startPhonkRadio(currentTrack.bpm, currentTrack.style, (step) => {
        setActiveStep(step);
      });
      setIsPlaying(true);
    }
  };

  const handleSelectTrack = (track: Track) => {
    soundManager.playClick();
    setCurrentTrack(track);
    if (isPlaying) {
      soundManager.startPhonkRadio(track.bpm, track.style, (step) => {
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
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#110617]/90 border border-rose-950/80 shadow-md backdrop-blur-md">
        <button
          onClick={handleTogglePlay}
          className={`p-1.5 rounded-lg transition ${
            isPlaying
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 animate-pulse'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
          title={isPlaying ? 'Pause Phonk Radio' : 'Play TikTok Viral Drift Phonk'}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>

        {/* Quick Beat Drop Button */}
        <button
          onClick={() => soundManager.playJedagJedugBeat()}
          className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-900/50 hover:bg-rose-900 text-rose-300 transition"
          title="Instant Jedag-Jedug 808 Cowbell Drop!"
        >
          <Flame className="h-3.5 w-3.5 text-amber-400" />
        </button>

        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer flex items-center gap-2 group px-1"
          title="Click to open radio tracklist & theme settings"
        >
          <div className="space-y-0.5 max-w-[140px] truncate">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[11px] font-bold text-white group-hover:text-rose-300 transition truncate">
                {currentTrack.name}
              </span>
            </div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block truncate">
              {currentTrack.genre} • {currentTrack.bpm} BPM
            </span>
          </div>

          {/* Mini Waveform Canvas */}
          <canvas ref={canvasRef} width={48} height={16} className="rounded bg-[#08020b] hidden sm:block" />
        </div>

        {/* Mechanical Keyboard Feedback Button (F47) */}
        <button
          onClick={handleToggleKeySound}
          className={`p-1.5 rounded-lg border transition ${
            isKeySoundOn
              ? 'bg-purple-950/80 border-purple-700/80 text-purple-300'
              : 'bg-slate-900/50 border-slate-800/80 text-slate-500 hover:text-slate-300'
          }`}
          title={`Mechanical Keyboard Sound: ${isKeySoundOn ? 'ON' : 'OFF'}`}
        >
          <Keyboard className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded Tracklist Popover */}
      {isExpanded && (
        <div className="absolute right-0 top-12 z-50 w-72 p-3 bg-[#0d0413] border border-rose-900/80 rounded-2xl shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-rose-950/60 text-slate-300 font-bold text-[11px]">
            <div className="flex items-center gap-1.5 text-rose-400">
              <Music className="h-3.5 w-3.5" />
              <span>TikTok Phonk Radio</span>
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
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Soundtracks:</span>
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

          {/* Themes */}
          <div className="space-y-1.5 pt-1 border-t border-rose-950/60">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Palette className="h-3 w-3 text-rose-400" />
              <span>Makima Cyber Themes:</span>
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

'use client';

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  ExternalLink,
  Code,
  Layers,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface LivePreviewCanvasProps {
  files?: Array<{ path: string; content: string; language: string }>;
  activeFilePath?: string;
}

export default function LivePreviewCanvas({
  files = [],
  activeFilePath,
}: LivePreviewCanvasProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [renderedSrc, setRenderedSrc] = useState<string>('');
  const [key, setKey] = useState(0);

  // Default sample HTML/Tailwind demo if no files match
  const defaultSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #08030b; color: #f8fafc; font-family: ui-sans-serif, system-ui; }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full bg-[#130718] border border-rose-900/60 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
    <div class="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-rose-600/40">
      ⚡
    </div>
    <h2 class="text-xl font-bold text-white tracking-tight">ZATA Live Component Preview</h2>
    <p class="text-xs text-rose-200/80 leading-relaxed">
      Rendering in-room VFS code in real-time with hot-reloading. Edit HTML or React code to see instant updates.
    </p>
    <div class="p-3 rounded-xl bg-[#09030d] border border-rose-950 text-[11px] font-mono text-emerald-400">
      ✓ Multi-Agent Generated UI Verified
    </div>
    <button class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs shadow-lg shadow-rose-900/40 hover:opacity-90 transition">
      Explore Architecture
    </button>
  </div>
</body>
</html>`;

  // Pick suitable file
  useEffect(() => {
    if (activeFilePath && files.some((f) => f.path === activeFilePath)) {
      setSelectedFile(activeFilePath);
      return;
    }

    const previewable = files.find(
      (f) =>
        f.path.endsWith('.html') ||
        f.path.endsWith('.svg') ||
        f.path.endsWith('.jsx') ||
        f.path.endsWith('.tsx')
    );

    if (previewable) {
      setSelectedFile(previewable.path);
    } else if (files.length > 0) {
      setSelectedFile(files[0].path);
    }
  }, [activeFilePath, files]);

  // Construct iframe source
  useEffect(() => {
    const fileObj = files.find((f) => f.path === selectedFile);
    if (!fileObj) {
      setRenderedSrc(defaultSample);
      return;
    }

    let content = fileObj.content;
    if (fileObj.path.endsWith('.svg')) {
      content = `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#08030b;">${content}</body></html>`;
    } else if (!content.includes('<html')) {
      content = `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>body{background:#08030b;color:#f8fafc;padding:24px;font-family:sans-serif;}</style></head><body>${content}</body></html>`;
    }

    setRenderedSrc(content);
  }, [selectedFile, files]);

  const deviceWidths = {
    desktop: 'w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[375px]',
  }[deviceMode];

  return (
    <div className="h-full flex flex-col bg-[#0b0510] border border-rose-950/70 rounded-2xl overflow-hidden font-mono text-xs shadow-2xl">
      {/* Top Controls Bar */}
      <div className="px-4 py-2.5 bg-[#120718] border-b border-rose-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-rose-400" />
          <span className="font-bold text-white text-xs">Live Split-Screen Preview Canvas</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
            Hot Reload
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* File selector */}
          <select
            value={selectedFile}
            onChange={(e) => {
              setSelectedFile(e.target.value);
              soundManager.playClick();
            }}
            className="px-2 py-1 rounded-lg bg-[#07030a] border border-rose-950 text-slate-300 text-[10px] focus:outline-none"
          >
            {files.length === 0 && <option value="">Default Live Demo</option>}
            {files.map((f) => (
              <option key={f.path} value={f.path}>
                {f.path}
              </option>
            ))}
          </select>

          {/* Device Toggles */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#07030a] border border-rose-950">
            <button
              onClick={() => {
                setDeviceMode('desktop');
                soundManager.playClick();
              }}
              className={`p-1 rounded ${deviceMode === 'desktop' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
              title="Desktop View"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setDeviceMode('tablet');
                soundManager.playClick();
              }}
              className={`p-1 rounded ${deviceMode === 'tablet' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
              title="Tablet View (768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setDeviceMode('mobile');
                soundManager.playClick();
              }}
              className={`p-1 rounded ${deviceMode === 'mobile' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
              title="Mobile View (375px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              setKey((prev) => prev + 1);
              soundManager.playClick();
            }}
            className="p-1.5 rounded-lg bg-[#1a0b22] hover:bg-rose-950 text-slate-400 hover:text-white border border-rose-950"
            title="Reload Frame"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-[#050207] p-4 flex items-center justify-center overflow-auto">
        <div
          className={`${deviceWidths} h-full bg-[#08030b] rounded-xl border border-rose-950/60 shadow-2xl overflow-hidden transition-all duration-300 relative`}
        >
          <iframe
            key={key}
            srcDoc={renderedSrc}
            title="Live Component Preview"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}

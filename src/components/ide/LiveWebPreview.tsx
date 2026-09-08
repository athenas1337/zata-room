'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VirtualFileDTO } from '@/types';
import {
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  ExternalLink,
  Code2,
  Terminal,
  AlertCircle,
  Eye,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface LiveWebPreviewProps {
  files: VirtualFileDTO[];
  activeFilePath?: string;
  onSelectFile?: (path: string) => void;
}

export default function LiveWebPreview({
  files,
  activeFilePath,
  onSelectFile,
}: LiveWebPreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: string; message: string; timestamp: string }>>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Find HTML, CSS, JS files
  const htmlFile = useMemo(() => {
    return (
      files.find((f) => f.path.endsWith('.html')) ||
      files.find((f) => f.name.toLowerCase().includes('index.html')) ||
      null
    );
  }, [files]);

  const cssFiles = useMemo(() => files.filter((f) => f.path.endsWith('.css')), [files]);
  const jsFiles = useMemo(() => files.filter((f) => f.path.endsWith('.js')), [files]);
  const mdFiles = useMemo(() => files.filter((f) => f.path.endsWith('.md')), [files]);

  // Construct srcdoc
  const srcDoc = useMemo(() => {
    // Intercept console.log and errors to send back to parent
    const consoleInterceptorScript = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          window.addEventListener('error', function(e) {
            window.parent.postMessage({ type: 'ZATA_PREVIEW_CONSOLE', logType: 'error', message: e.message }, '*');
          });
          console.log = function(...args) {
            originalLog.apply(console, args);
            window.parent.postMessage({ type: 'ZATA_PREVIEW_CONSOLE', logType: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
          };
          console.error = function(...args) {
            originalError.apply(console, args);
            window.parent.postMessage({ type: 'ZATA_PREVIEW_CONSOLE', logType: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
          };
          console.warn = function(...args) {
            originalWarn.apply(console, args);
            window.parent.postMessage({ type: 'ZATA_PREVIEW_CONSOLE', logType: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
          };
        })();
      </script>
    `;

    if (htmlFile) {
      let content = htmlFile.content;
      // Inject CSS
      const injectedCss = cssFiles.map((c) => `<style>/* ${c.path} */\n${c.content}</style>`).join('\n');
      // Inject JS
      const injectedJs = jsFiles.map((j) => `<script>/* ${j.path} */\n${j.content}</script>`).join('\n');

      if (content.includes('</head>')) {
        content = content.replace('</head>', `${consoleInterceptorScript}\n${injectedCss}\n</head>`);
      } else {
        content = `${consoleInterceptorScript}\n${injectedCss}\n${content}`;
      }

      if (content.includes('</body>')) {
        content = content.replace('</body>', `${injectedJs}\n</body>`);
      } else {
        content = `${content}\n${injectedJs}`;
      }
      return content;
    }

    // Default template if no index.html is found
    const fileListMarkup = files
      .map(
        (f) => `
      <li style="padding: 6px 12px; margin-bottom: 4px; background: #130819; border: 1px solid #381224; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #f43f5e; font-family: monospace;">${f.path}</span>
        <span style="color: #94a3b8; font-size: 11px;">${Math.ceil((f.sizeBytes || f.content.length) / 1024)} KB</span>
      </li>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>ZATA Virtual App Preview</title>
          ${consoleInterceptorScript}
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #08030b;
              color: #f1f5f9;
              margin: 0;
              padding: 24px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 85vh;
              text-align: center;
            }
            .card {
              max-width: 520px;
              width: 100%;
              background: #0f0515;
              border: 1px solid #4c0519;
              border-radius: 16px;
              padding: 24px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            }
            h1 {
              color: #fb7185;
              font-size: 20px;
              margin-top: 0;
              margin-bottom: 8px;
            }
            p {
              color: #94a3b8;
              font-size: 13px;
              line-height: 1.5;
            }
            ul {
              list-style: none;
              padding: 0;
              text-align: left;
              margin: 16px 0;
            }
            .badge {
              display: inline-block;
              background: #e11d48;
              color: white;
              font-size: 10px;
              font-weight: bold;
              padding: 2px 8px;
              border-radius: 9999px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 12px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Live VFS Preview</span>
            <h1>ZATA Agentic Web App</h1>
            <p>Ready to render! Create an <code>index.html</code> file in your workspace to render your live web app directly here in real-time.</p>
            <p style="font-size: 12px; color: #fda4af;">Current workspace contains ${files.length} virtual files:</p>
            <ul>${fileListMarkup}</ul>
          </div>
        </body>
      </html>
    `;
  }, [htmlFile, cssFiles, jsFiles, files]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ZATA_PREVIEW_CONSOLE') {
        const newLog = {
          type: event.data.logType || 'log',
          message: event.data.message || '',
          timestamp: new Date().toLocaleTimeString(),
        };
        setConsoleLogs((prev) => [...prev.slice(-49), newLog]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRefresh = () => {
    soundManager.playClick();
    setKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    soundManager.playCheckpoint();
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-[#08040a] font-mono text-xs select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0e0513] border-b border-rose-950/60">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-rose-400" />
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Live Web Preview {htmlFile ? `(${htmlFile.path})` : ''}
          </span>
        </div>

        {/* Viewport Width Toggles */}
        <div className="flex items-center gap-1 bg-[#15071d] p-0.5 rounded-lg border border-rose-950/80">
          <button
            onClick={() => {
              soundManager.playClick();
              setDevice('desktop');
            }}
            className={`p-1.5 rounded-md transition ${
              device === 'desktop'
                ? 'bg-rose-900/60 text-rose-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setDevice('tablet');
            }}
            className={`p-1.5 rounded-md transition ${
              device === 'tablet'
                ? 'bg-rose-900/60 text-rose-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setDevice('mobile');
            }}
            className={`p-1.5 rounded-md transition ${
              device === 'mobile'
                ? 'bg-rose-900/60 text-rose-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab(activeTab === 'preview' ? 'console' : 'preview')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
              activeTab === 'console'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <Terminal className="h-3 w-3" />
            <span>Console ({consoleLogs.length})</span>
          </button>

          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 transition"
            title="Refresh Preview"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleOpenExternal}
            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 transition"
            title="Open in Full Tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview / Console Area */}
      <div className="flex-1 overflow-hidden relative bg-[#040106] flex items-center justify-center p-2">
        {activeTab === 'preview' ? (
          <div
            className={`h-full transition-all duration-300 bg-white rounded-lg overflow-hidden shadow-2xl ${
              device === 'desktop'
                ? 'w-full'
                : device === 'tablet'
                ? 'w-[768px] border-4 border-slate-800'
                : 'w-[375px] border-4 border-slate-800'
            }`}
          >
            <iframe
              ref={iframeRef}
              key={key}
              srcDoc={srcDoc}
              title="ZATA Web Preview"
              sandbox="allow-scripts allow-modals"
              className="w-full h-full border-0 bg-white"
            />
          </div>
        ) : (
          /* Captured Console Output */
          <div className="w-full h-full p-3 bg-[#0a040d] overflow-y-auto space-y-1 text-slate-300 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-rose-950/60 text-slate-400 text-[11px]">
              <span>Captured Console Logs</span>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-slate-500 hover:text-red-400 text-[10px]"
              >
                Clear Console
              </button>
            </div>
            {consoleLogs.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No console output recorded from iframe.</p>
            ) : (
              consoleLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-1.5 rounded flex items-start gap-2 ${
                    log.type === 'error'
                      ? 'bg-red-950/40 text-red-300 border-l-2 border-red-500'
                      : log.type === 'warn'
                      ? 'bg-amber-950/40 text-amber-300 border-l-2 border-amber-500'
                      : 'bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">[{log.timestamp}]</span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

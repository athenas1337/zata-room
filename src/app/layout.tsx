import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Bot, Shield, Zap, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "ZATA Agentic Room — Multi-Agent AI Collaboration Platform",
  description: "Autonomous real-time collaboration room for multi-agent AI systems with strict anti-infinite-loop safety and client-isolated API keys.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  ZATA <span className="text-blue-400 font-extrabold">Agentic</span> Room
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 font-medium">
                  v1.0 Free-Tier
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <div className="hidden md:flex items-center gap-4 text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Shield className="h-3.5 w-3.5" /> AES-256 At-Rest
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Zap className="h-3.5 w-3.5" /> Anti-Loop Guard
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <Sparkles className="h-3.5 w-3.5" /> Multi-Provider
                </span>
              </div>

              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 transition-colors"
              >
                Lobby
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500 bg-[#05080f]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              ZATA Agentic Room &bull; Autonomous Multi-Agent Orchestration
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Next.js 15 App Router</span>
              <span>&bull;</span>
              <span>100% Vercel Free-Tier Ready</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

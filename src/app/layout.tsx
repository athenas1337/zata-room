import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Shield, Zap, Sparkles, Search, Command, Radio, Activity } from "lucide-react";
import MakimaLogo from "@/components/brand/MakimaLogo";

export const metadata: Metadata = {
  title: "ZATA Agentic Room — Autonomous AI Collaboration Cloud IDE",
  description: "Next-gen GitHub-grade Cloud IDE and multi-agent AI collaboration platform with sandboxed VFS and interactive terminal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#070309] text-slate-100 antialiased selection:bg-rose-600 selection:text-white">
        {/* Top Makima Cyber-Noir Navigation Header */}
        <header className="sticky top-0 z-50 border-b border-rose-950/60 bg-[#070309]/90 backdrop-blur-xl shadow-lg shadow-black/60">
          <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Makima Jedag-Jedug Animated Logo with ZATA COMMUNITY Badge */}
            <Link href="/" className="group flex items-center">
              <MakimaLogo size="md" showSubtitle={true} interactive={true} />
            </Link>

            {/* Quick Command Palette Trigger (GitHub style) */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#120718] border border-rose-950/60 text-slate-400 text-xs font-mono select-none hover:border-rose-700/60 transition cursor-pointer group">
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-rose-400 group-hover:text-rose-300" />
                  <span className="text-slate-400">Search workspace, files, or commands...</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">
                  <Command className="h-2.5 w-2.5" />
                  <span>K</span>
                </div>
              </div>
            </div>

            {/* System Status Indicators & Navigation */}
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-900/60">
                  <Radio className="h-3 w-3 text-rose-500 animate-pulse" />
                  <span>Swarm: Active</span>
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Shield className="h-3.5 w-3.5 text-amber-500" /> AES-256
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" /> Anti-Loop &lt;500ms
                </span>
              </div>

              <Link
                href="/status"
                className="px-2.5 py-1.5 rounded-xl border border-rose-950/80 bg-[#140819] hover:bg-rose-950/60 text-slate-300 hover:text-white font-medium text-xs font-mono transition shadow-sm flex items-center gap-1.5"
                title="View Platform Health & Latency Status"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Status</span>
              </Link>

              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-xl border border-rose-950/80 bg-[#140819] hover:bg-rose-950/60 text-rose-200 hover:text-white font-medium text-xs font-mono transition shadow-sm"
              >
                Lobby
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="border-t border-rose-950/50 py-4 text-center text-xs text-slate-500 bg-[#050207] font-mono">
          <div className="max-w-[1750px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-rose-400 font-bold">ZATA COMMUNITY</span>
              <span>&bull;</span>
              <span>Autonomous Swarm Cloud IDE &bull; 100% Vercel Free-Tier</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-[11px]">
              <Link href="/status" className="hover:text-rose-300 transition">
                Live Status
              </Link>
              <span>&bull;</span>
              <span>Next.js 15 App Router</span>
              <span>&bull;</span>
              <span>Antigravity VFS &amp; Terminal Engine</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

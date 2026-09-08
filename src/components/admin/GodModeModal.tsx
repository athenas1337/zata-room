'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Zap,
  Radio,
  Trash2,
  Lock,
  Unlock,
  Check,
  AlertTriangle,
  Server,
  Activity,
  ExternalLink,
  RefreshCw,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { soundManager } from '@/lib/sound';

interface GodModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GodModeModal({ isOpen, onClose }: GodModeModalProps) {
  const [passcode, setPasscode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastLevel, setBroadcastLevel] = useState<'info' | 'warning' | 'critical'>('info');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [killswitchActive, setKillswitchActive] = useState(false);

  useEffect(() => {
    if (isOpen && !isVerified) {
      // Check if previously entered in session
      const cached = sessionStorage.getItem('zata_godmode_pass');
      if (cached === 'Atha1337') {
        verifyPass('Atha1337');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const verifyPass = async (codeToVerify?: string) => {
    const code = codeToVerify || passcode;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/godmode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-godmode-pass': code,
        },
        body: JSON.stringify({ action: 'verify' }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Access Denied: Invalid Passcode');
      }

      setIsVerified(true);
      sessionStorage.setItem('zata_godmode_pass', code);
      soundManager.playCheckpoint();
      loadRooms(code);
    } catch (err: any) {
      setError(err.message || 'Passcode verification failed');
      soundManager.playStop();
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async (code?: string) => {
    const activePass = code || passcode || sessionStorage.getItem('zata_godmode_pass') || '';
    setLoading(true);
    try {
      const res = await fetch('/api/admin/godmode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-godmode-pass': activePass,
        },
        body: JSON.stringify({ action: 'list_all' }),
      });
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms || []);
      }
    } catch (err: any) {
      console.error('Failed to load rooms in godmode:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceStopAll = async () => {
    if (!confirm('EMERGENCY: Force pause ALL agent loops across all active rooms?')) return;
    const activePass = passcode || sessionStorage.getItem('zata_godmode_pass') || '';
    soundManager.playStop();
    try {
      await fetch('/api/admin/godmode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-godmode-pass': activePass,
        },
        body: JSON.stringify({ action: 'force_stop_all' }),
      });
      setKillswitchActive(true);
      setTimeout(() => setKillswitchActive(false), 4000);
      loadRooms();
    } catch (err) {
      console.error('Error executing force stop:', err);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`DEVELOPER OVERRIDE: Permanently delete "${roomName}"?`)) return;
    const activePass = passcode || sessionStorage.getItem('zata_godmode_pass') || '';
    soundManager.playStop();
    try {
      await fetch('/api/admin/godmode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-godmode-pass': activePass,
        },
        body: JSON.stringify({ action: 'delete_room', roomId }),
      });
      loadRooms();
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    const activePass = passcode || sessionStorage.getItem('zata_godmode_pass') || '';
    try {
      await fetch('/api/admin/godmode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-godmode-pass': activePass,
        },
        body: JSON.stringify({
          action: 'global_broadcast',
          message: broadcastMsg.trim(),
          level: broadcastLevel,
        }),
      });
      soundManager.playTurnPing();
      setBroadcastSuccess(true);
      setBroadcastMsg('');
      setTimeout(() => setBroadcastSuccess(false), 3000);
    } catch (err) {
      console.error('Broadcast failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-4xl w-full bg-slate-950 border-2 border-amber-500/80 rounded-2xl shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-amber-400 tracking-wide flex items-center gap-2">
                <span>ZATA DEVELOPER GODMODE</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-black font-bold uppercase">
                  SUPERUSER
                </span>
              </h2>
              <p className="text-xs text-slate-400">Developer Master Control &amp; Global Supervisor Dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isVerified ? (
            /* Passcode Unlock Screen */
            <div className="max-w-md mx-auto py-8 space-y-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                <Lock className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Enter Developer Passcode</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Authenticate with Atha&apos;s master key to access unrestricted godmode functions.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyPass();
                }}
                className="space-y-3"
              >
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter Master Passcode"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/50 text-amber-300 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!passcode || loading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition disabled:opacity-50"
                >
                  {loading ? 'Validating...' : 'Unlock GodMode Console'}
                </button>
              </form>
            </div>
          ) : (
            /* Authenticated GodMode Workspace */
            <div className="space-y-6">
              {/* Emergency Control & Telemetry Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Global Killswitch */}
                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/60 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-red-400" />
                      <span>Global Emergency Killswitch</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Immediately halts all agent execution loops across every room in the database.
                    </p>
                  </div>
                  <button
                    onClick={handleForceStopAll}
                    className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-1.5"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>FORCE HALT ALL ROOMS</span>
                  </button>
                </div>

                {/* System Telemetry */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    <span>System Telemetry</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Rooms:</span>
                      <span className="font-bold text-white font-mono">{rooms.length}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Active Loops:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {rooms.filter((r) => r.status === 'ACTIVE').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Vercel Free-Tier Mode:</span>
                      <span className="font-bold text-cyan-400 font-mono">Simulated Sandbox</span>
                    </div>
                  </div>
                  <button
                    onClick={() => loadRooms()}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Refresh Telemetry</span>
                  </button>
                </div>

                {/* Master Identity */}
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 flex flex-col justify-between space-y-2">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Unlock className="h-4 w-4 text-amber-400" />
                    <span>Developer Identity</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Logged in as: <strong className="text-amber-400 font-mono">Atha (Developer)</strong>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Full root rights. Can inspect any room, remove any room, and broadcast alerts.
                  </p>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="h-3 w-3" /> Root Authorization Valid
                  </div>
                </div>
              </div>

              {killswitchActive && (
                <div className="p-3 rounded-xl bg-red-950 border border-red-700 text-red-200 text-xs font-bold text-center animate-pulse">
                  🚨 Global Killswitch executed! All agent loops have been paused.
                </div>
              )}

              {/* Global Broadcast Form */}
              <form onSubmit={handleBroadcast} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio className="h-4 w-4 text-cyan-400" />
                    <span>Broadcast Message to All Live Rooms</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(['info', 'warning', 'critical'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setBroadcastLevel(lvl)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                          broadcastLevel === lvl
                            ? lvl === 'critical'
                              ? 'bg-red-600 text-white'
                              : lvl === 'warning'
                              ? 'bg-amber-500 text-black'
                              : 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Enter broadcast message to appear in real-time across all connected clients..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={!broadcastMsg.trim()}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-40"
                  >
                    Broadcast
                  </button>
                </div>

                {broadcastSuccess && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Broadcast sent successfully to all active room SSE channels.
                  </div>
                )}
              </form>

              {/* All System Rooms Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    System Room Directory ({rooms.length})
                  </span>
                  <span className="text-[10px] text-slate-500">Click &quot;Visit&quot; to inspect or &quot;Delete&quot; to wipe</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Room Name</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Passcode</th>
                          <th className="py-2.5 px-3">Agents</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {rooms.map((rm) => (
                          <tr key={rm.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-2.5 px-3 font-medium text-white">
                              <div>{rm.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{rm.id}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  rm.status === 'ACTIVE'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {rm.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-400">
                              {rm.isPublic ? '🌐 Public' : '🔒 Invite-Only'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-400">
                              {rm.inviteCode || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 font-mono">
                              {rm.participants?.length || 0}
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-1">
                              <Link
                                href={`/rooms/${rm.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Visit</span>
                              </Link>
                              <button
                                onClick={() => handleDeleteRoom(rm.id, rm.name)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-[11px] transition"
                                title="Force Delete Room"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

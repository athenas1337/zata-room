'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2, Globe, Lock, ShieldCheck, Users } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface RoomInviteModalProps {
  roomId: string;
  roomName: string;
  inviteCode?: string | null;
  isPublic?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function RoomInviteModal({
  roomId,
  roomName,
  inviteCode,
  isPublic = true,
  isOpen,
  onClose,
}: RoomInviteModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = `${origin}/rooms/${roomId}${inviteCode ? `?invite=${inviteCode}` : ''}`;

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    soundManager.playClick();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    soundManager.playClick();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Invite Collaborators</h3>
              <p className="text-xs text-slate-400">{roomName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        {/* Room Privacy Badge */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            {isPublic ? (
              <>
                <Globe className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-white">Public Room</div>
                  <div className="text-[11px] text-slate-400">Listed on Lobby, anyone can view & join</div>
                </div>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-white">Invite-Only Room</div>
                  <div className="text-[11px] text-slate-400">Hidden from Lobby, requires invite code to access</div>
                </div>
              </>
            )}
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isPublic ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
            {isPublic ? 'Open' : 'Restricted'}
          </span>
        </div>

        {/* Secret Passphrase / Invite Code */}
        {inviteCode && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Room Passcode / Invite Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-base font-bold text-cyan-400 tracking-wider text-center select-all">
                {inviteCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Friends can paste this code on the Lobby page to join instantly.</p>
          </div>
        )}

        {/* Direct Link */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">Direct Room Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 font-mono truncate focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-slate-300 space-y-1">
          <div className="font-semibold text-blue-300 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>Host & Guest Roles</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            As the Host, only you have authority to trigger instant stop, cycle turns, adjust safety caps, or delete this room. Guests can spectate, inspect code in the VFS, and send guidance messages.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

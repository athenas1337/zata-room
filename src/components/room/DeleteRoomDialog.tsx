'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { soundManager } from '@/lib/sound';

interface DeleteRoomDialogProps {
  roomId: string;
  roomName: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  isHost?: boolean;
  isGodMode?: boolean;
}

export default function DeleteRoomDialog({
  roomId,
  roomName,
  isOpen,
  onClose,
  onDeleted,
  isHost = false,
  isGodMode = false,
}: DeleteRoomDialogProps) {
  const router = useRouter();
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!isGodMode && confirmName.trim() !== roomName.trim()) {
      setError('Room name does not match confirmation.');
      return;
    }

    setIsDeleting(true);
    setError(null);
    soundManager.playStop();

    try {
      // Look for host secret in localStorage
      let hostSecret = '';
      try {
        const stored = localStorage.getItem('zata_host_secrets');
        if (stored) {
          const map = JSON.parse(stored);
          hostSecret = map[roomId] || '';
        }
      } catch (e) {
        // ignore storage parse error
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (hostSecret) headers['x-host-secret'] = hostSecret;
      if (isGodMode) headers['x-godmode-pass'] = 'Atha1337';

      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete room');
      }

      // Cleanup local secrets
      try {
        const stored = localStorage.getItem('zata_host_secrets');
        if (stored) {
          const map = JSON.parse(stored);
          delete map[roomId];
          localStorage.setItem('zata_host_secrets', JSON.stringify(map));
        }
      } catch (e) {
        // ignore
      }

      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Deletion failed. Check permissions.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-red-900/60 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Permanently Delete Room</h3>
            <p className="text-xs text-red-400">Irreversible Action &bull; Host / Developer Only</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 text-xs text-red-300/90 space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            Warning: All data will be purged!
          </p>
          <p className="text-[11px] leading-relaxed">
            Deleting this room will wipe all virtual workspace files, terminal execution logs, chat transcript, and agent configurations permanently.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-950/90 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isGodMode && (
          <div className="space-y-1.5">
            <label className="block text-xs text-slate-300 font-medium">
              Type <span className="text-red-400 font-mono font-bold select-all">&quot;{roomName}&quot;</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={roomName}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-red-500"
            />
          </div>
        )}

        {isGodMode && (
          <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-800/60 text-[11px] text-amber-300 flex items-center gap-1.5">
            <span>⚡ GodMode Activated: Instant Developer Override bypass enabled.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || (!isGodMode && confirmName.trim() !== roomName.trim())}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition disabled:opacity-40 flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Room Forever'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Key, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

function LookupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError('No invite code specified.');
      setLoading(false);
      return;
    }

    const lookup = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/rooms/lookup?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (data.success && data.room?.id) {
          router.replace(`/rooms/${data.room.id}?invite=${encodeURIComponent(code)}`);
        } else {
          setError(data.error || 'Room not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Lookup failed.');
      } finally {
        setLoading(false);
      }
    };

    lookup();
  }, [code, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      {loading ? (
        <div className="space-y-3">
          <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-medium">Resolving Room Invite Code &quot;{code}&quot;...</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 w-full shadow-2xl">
          <div className="h-12 w-12 rounded-2xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center mx-auto text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Invite Code Not Found</h2>
            <p className="text-xs text-slate-400 mt-1">{error || 'Invalid or expired room code.'}</p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Lobby</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoomLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-2">Loading...</p>
        </div>
      }
    >
      <LookupContent />
    </Suspense>
  );
}

import { NextRequest } from 'next/server';
import { registerSSEClient, unregisterSSEClient } from '@/lib/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let streamController: ReadableStreamDefaultController | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;
      registerSSEClient(id, controller);

      // Keep-alive heartbeat every 15s for Vercel/proxy timeout prevention
      heartbeatTimer = setInterval(() => {
        try {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(': heartbeat ping\n\n'));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, 15000);
    },
    cancel() {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (streamController) {
        unregisterSSEClient(id, streamController);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering on Nginx/Cloudflare
    },
  });
}

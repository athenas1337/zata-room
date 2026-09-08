import { SSEPayload } from '@/types';

// In-memory registry of active SSE stream controllers for rooms
// Key: roomId, Value: Set of ReadableStreamDefaultController
const roomClients = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Register a new client SSE stream controller for a room.
 */
export function registerSSEClient(roomId: string, controller: ReadableStreamDefaultController) {
  if (!roomClients.has(roomId)) {
    roomClients.set(roomId, new Set());
  }
  roomClients.get(roomId)!.add(controller);

  // Send initial connection handshake
  broadcastToRoom(roomId, {
    type: 'STATUS_UPDATE',
    data: { connected: true, roomId, timestamp: Date.now() },
    timestamp: Date.now(),
  });
}

/**
 * Unregister a client SSE controller when disconnected.
 */
export function unregisterSSEClient(roomId: string, controller: ReadableStreamDefaultController) {
  const clients = roomClients.get(roomId);
  if (clients) {
    clients.delete(controller);
    if (clients.size === 0) {
      roomClients.delete(roomId);
    }
  }
}

/**
 * Broadcast an SSE payload to all active listeners in a room.
 */
export function broadcastToRoom(roomId: string, payload: SSEPayload) {
  const clients = roomClients.get(roomId);
  if (!clients || clients.size === 0) return;

  const message = `event: message\ndata: ${JSON.stringify(payload)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(message);

  const staleControllers: ReadableStreamDefaultController[] = [];

  for (const controller of clients) {
    try {
      controller.enqueue(encoded);
    } catch (err) {
      staleControllers.push(controller);
    }
  }

  // Clean up any closed or errored controllers
  for (const stale of staleControllers) {
    clients.delete(stale);
  }
}

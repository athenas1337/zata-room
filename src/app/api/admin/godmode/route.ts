import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { broadcastToAllRooms, broadcastToRoom } from '@/lib/sse';

const GODMODE_KEY = 'Atha1337';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-godmode-pass');
    const body = await req.json().catch(() => ({}));
    const passcode = authHeader || body.passcode;

    if (passcode !== GODMODE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Invalid GodMode developer passcode.' },
        { status: 403 }
      );
    }

    const { action } = body;

    if (action === 'verify') {
      return NextResponse.json({
        success: true,
        verified: true,
        user: 'Atha (System Developer & Creator)',
      });
    }

    if (action === 'list_all') {
      const rooms = await dataStore.getAllRoomsAdmin();
      return NextResponse.json({ success: true, rooms });
    }

    if (action === 'force_stop_all') {
      await dataStore.forceStopAllRooms();
      broadcastToAllRooms({
        type: 'GLOBAL_BROADCAST',
        data: {
          level: 'critical',
          message: '🚨 EMERGENCY HALT: System Developer Atha has triggered Global Killswitch. All agent loops paused.',
          sender: 'Atha1337 (GodMode)',
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });
      return NextResponse.json({
        success: true,
        message: 'All agent loops across all rooms have been terminated.',
      });
    }

    if (action === 'delete_room') {
      const { roomId } = body;
      if (!roomId) {
        return NextResponse.json({ success: false, error: 'roomId is required' }, { status: 400 });
      }

      broadcastToRoom(roomId, {
        type: 'STATUS_UPDATE',
        data: { deleted: true, reason: 'Room deleted by Developer Atha (GodMode)' },
        timestamp: Date.now(),
      });

      await dataStore.deleteRoom(roomId);
      return NextResponse.json({ success: true, roomId, deleted: true });
    }

    if (action === 'global_broadcast') {
      const { message, level = 'info' } = body;
      if (!message) {
        return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
      }

      broadcastToAllRooms({
        type: 'GLOBAL_BROADCAST',
        data: {
          level,
          message,
          sender: 'Developer Atha (Broadcast)',
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });

      return NextResponse.json({ success: true, broadcasted: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

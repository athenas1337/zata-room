import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { broadcastToRoom } from '@/lib/sse';
import { simulateVirtualTerminalCommand } from '@/lib/orchestrator/engine';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const room = await dataStore.getRoomById(id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, logs: room.terminalLogs || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { command, executedBy } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ success: false, error: 'Command string is required' }, { status: 400 });
    }

    const room = await dataStore.getRoomById(id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const sim = simulateVirtualTerminalCommand(command, room);

    const log = await dataStore.addTerminalLog(id, {
      command: command.trim(),
      output: sim.output,
      exitCode: sim.exitCode,
      executedBy: executedBy || 'Human Director',
    });

    broadcastToRoom(id, {
      type: 'TERMINAL_OUTPUT',
      data: log,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

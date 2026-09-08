import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { broadcastToRoom } from '@/lib/sse';

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

    // Ensure encrypted keys and IVs are NOT returned in the API response
    const sanitizedParticipants = (room.participants || []).map((p: any) => ({
      id: p.id,
      roomId: p.roomId,
      userId: p.userId,
      agentName: p.agentName,
      roleLabel: p.roleLabel,
      avatarColor: p.avatarColor,
      systemPrompt: p.systemPrompt,
      provider: p.provider,
      modelName: p.modelName,
      keyMask: p.keyMask,
      baseUrl: p.baseUrl,
      turnOrder: p.turnOrder,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      success: true,
      room: {
        ...room,
        participants: sanitizedParticipants,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const allowedUpdates: any = {};
    if (body.status) allowedUpdates.status = body.status;
    if (typeof body.turnDelaySec === 'number') allowedUpdates.turnDelaySec = body.turnDelaySec;
    if (typeof body.maxTurns === 'number') allowedUpdates.maxTurns = body.maxTurns;
    if (body.goal) allowedUpdates.goal = body.goal;
    if (body.name) allowedUpdates.name = body.name;
    if (body.safetyConfig) allowedUpdates.safetyConfig = body.safetyConfig;

    const updated = await dataStore.updateRoom(id, allowedUpdates);

    // Broadcast status update
    broadcastToRoom(id, {
      type: 'STATUS_UPDATE',
      data: {
        status: updated?.status,
        currentTurn: updated?.currentTurn,
        turnDelaySec: updated?.turnDelaySec,
      },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, room: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const godmodePass = req.headers.get('x-godmode-pass');
    const hostSecret = req.headers.get('x-host-secret');

    const room = await dataStore.getRoomById(id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    // Host or GodMode authorization check
    const isAuthorized =
      godmodePass === 'Atha1337' ||
      !room.hostSecret ||
      hostSecret === room.hostSecret;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only the Room Host or Developer GodMode can delete this room.' },
        { status: 403 }
      );
    }

    await dataStore.deleteRoom(id);

    broadcastToRoom(id, {
      type: 'STATUS_UPDATE',
      data: { status: 'ARCHIVED', deleted: true },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, message: 'Room deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

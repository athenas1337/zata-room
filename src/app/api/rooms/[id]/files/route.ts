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
    return NextResponse.json({ success: true, files: room.virtualFiles || [] });
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
    const { path, content, language, updatedBy, action } = body;

    if (!path) {
      return NextResponse.json({ success: false, error: 'Path is required' }, { status: 400 });
    }

    if (action === 'delete') {
      await dataStore.deleteVirtualFile(id, path);
      broadcastToRoom(id, {
        type: 'FILE_UPDATE',
        data: { deleted: true, path },
        timestamp: Date.now(),
      });
      return NextResponse.json({ success: true, path, deleted: true });
    }

    if (typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const file = await dataStore.upsertVirtualFile(id, path, {
      content,
      language,
      updatedBy: updatedBy || 'Human Director',
    });

    broadcastToRoom(id, {
      type: 'FILE_UPDATE',
      data: file,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, file });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

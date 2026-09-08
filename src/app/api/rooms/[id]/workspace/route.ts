import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { broadcastToRoom } from '@/lib/sse';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { key, title, value, itemType, updatedBy } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    const item = await dataStore.upsertWorkspaceItem(id, key, {
      title: title || key,
      value,
      itemType: itemType || 'scratchpad',
      updatedBy: updatedBy || 'Human Director',
    });

    broadcastToRoom(id, {
      type: 'WORKSPACE_UPDATE',
      data: item,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

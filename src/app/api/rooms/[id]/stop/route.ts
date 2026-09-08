import { NextRequest, NextResponse } from 'next/server';
import { stopRoomInstantly } from '@/lib/orchestrator/engine';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason || 'Manual stop triggered by Human Director';

    await stopRoomInstantly(id, reason);

    return NextResponse.json({
      success: true,
      message: 'Room stopped instantly.',
      status: 'PAUSED',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to stop room' },
      { status: 500 }
    );
  }
}

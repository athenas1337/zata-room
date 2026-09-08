import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, error: 'Invite code is required' }, { status: 400 });
    }

    const room = await dataStore.findRoomByInviteCode(code);
    if (!room) {
      return NextResponse.json(
        { success: false, error: `No active room found with invite code "${code}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, room });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

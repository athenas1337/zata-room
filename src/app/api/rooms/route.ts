import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { z } from 'zod';

const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(120),
  goal: z.string().min(1, 'Project goal is required'),
  isPublic: z.boolean().optional().default(true),
  turnDelaySec: z.number().int().min(1).max(60).default(5),
  maxTurns: z.number().int().min(5).max(200).default(50),
  safetyConfig: z.object({
    repetitionThreshold: z.number().min(0.5).max(1.0).default(0.85),
    maxBudgetUsd: z.number().min(0).max(100).default(2.0),
    maxTurns: z.number().int().min(5).max(200).default(50),
    echoThreshold: z.number().min(0.5).max(1.0).default(0.8),
    requireApprovalOnAction: z.boolean().default(false),
  }).optional(),
});

export async function GET() {
  try {
    const rooms = await dataStore.getRooms();
    return NextResponse.json({ success: true, rooms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const newRoom = await dataStore.createRoom(parsed.data);
    return NextResponse.json({ success: true, room: newRoom }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

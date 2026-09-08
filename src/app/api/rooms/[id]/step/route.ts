import { NextRequest, NextResponse } from 'next/server';
import { executeRoomStep } from '@/lib/orchestrator/engine';

export const maxDuration = 60; // Max allowed duration on Vercel Hobby/Pro streaming

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await executeRoomStep(id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Turn execution failed' },
      { status: 500 }
    );
  }
}

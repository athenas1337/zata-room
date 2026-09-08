import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { broadcastToRoom } from '@/lib/sse';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const room = await dataStore.getRoomById(id);

    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    if (format === 'markdown') {
      let md = `# ZATA Agentic Room Session Transcript\n\n`;
      md += `**Room:** ${room.name}\n`;
      md += `**Goal:** ${room.goal}\n`;
      md += `**Total Turns:** ${room.currentTurn}\n`;
      md += `**Total Tokens Used:** ${room.totalTokens}\n`;
      md += `**Estimated Cost:** $${room.estimatedCost.toFixed(4)}\n\n`;
      md += `---\n\n## Conversation Log\n\n`;

      for (const msg of room.messages || []) {
        const time = msg.createdAt ? new Date(msg.createdAt).toISOString() : '';
        md += `### [Turn ${msg.turnNumber}] ${msg.senderName} (${msg.senderRole}) — *${time}*\n\n`;
        md += `${msg.content}\n\n`;
        if (msg.toolCalls) {
          md += `*Workspace Actions:*\n\`\`\`json\n${JSON.stringify(msg.toolCalls, null, 2)}\n\`\`\`\n\n`;
        }
      }

      md += `---\n\n## Final Workspace Artifacts\n\n`;
      for (const item of room.workspaceItems || []) {
        md += `### [${item.key}] ${item.title} *(Updated by ${item.updatedBy})*\n\n`;
        md += `${typeof item.value === 'string' ? item.value : '```json\n' + JSON.stringify(item.value, null, 2) + '\n```'}\n\n`;
      }

      return new NextResponse(md, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="zata-room-${id}-transcript.md"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      messages: room.messages,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Allow Human Director to post guidance / instructions directly into the conversation
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const room = await dataStore.getRoomById(id);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const message = await dataStore.addMessage({
      roomId: id,
      senderRole: 'Human Director',
      senderName: 'Human Director',
      content: content.trim(),
      turnNumber: room.currentTurn,
      isCheckpoint: false,
    });

    broadcastToRoom(id, {
      type: 'AGENT_MESSAGE',
      data: {
        id: message.id,
        roomId: id,
        senderRole: 'Human Director',
        senderName: 'Human Director',
        avatarColor: '#f59e0b',
        content: message.content,
        turnNumber: room.currentTurn,
        tokenCount: 0,
        createdAt: new Date().toISOString(),
      },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { validateApiKey } from '@/lib/providers/validator';
import { z } from 'zod';

const participantSchema = z.object({
  agentName: z.string().min(1, 'Agent name is required').max(60),
  roleLabel: z.string().min(1, 'Role label is required').max(80),
  avatarColor: z.string().optional(),
  systemPrompt: z.string().default(''),
  provider: z.enum(['OPENAI', 'ANTHROPIC', 'GOOGLE', 'CUSTOM_GATEWAY']),
  modelName: z.string().min(1, 'Model name is required'),
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z.string().url().optional().nullable().or(z.literal('')),
  skipValidation: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = participantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { agentName, roleLabel, avatarColor, systemPrompt, provider, modelName, apiKey, baseUrl, skipValidation } = parsed.data;

    // Optional health validation call if not skipped
    if (!skipValidation) {
      const validation = await validateApiKey(provider, apiKey, baseUrl, modelName);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: `API key validation failed: ${validation.error}. Please check your credentials or network.`,
          },
          { status: 400 }
        );
      }
    }

    const participant = await dataStore.addParticipant(id, {
      agentName,
      roleLabel,
      avatarColor,
      systemPrompt,
      provider,
      modelName,
      apiKey,
      baseUrl: baseUrl || null,
    });

    // Return sanitized DTO (omit encrypted secrets)
    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        roomId: participant.roomId,
        agentName: participant.agentName,
        roleLabel: participant.roleLabel,
        avatarColor: participant.avatarColor,
        provider: participant.provider,
        modelName: participant.modelName,
        keyMask: participant.keyMask,
        baseUrl: participant.baseUrl,
        turnOrder: participant.turnOrder,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

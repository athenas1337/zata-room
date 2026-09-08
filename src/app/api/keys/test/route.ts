import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/providers/validator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey, baseUrl, modelName } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Provider and API Key are required' },
        { status: 400 }
      );
    }

    const result = await validateApiKey(provider, apiKey, baseUrl, modelName);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error.message || 'Key validation error' },
      { status: 500 }
    );
  }
}

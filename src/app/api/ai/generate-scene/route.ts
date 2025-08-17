import { generateSceneDescription } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for generating roleplay scene descriptions.
 *
 * @param request HTTP request containing context for scene generation
 * @returns Scene description or error response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context } = body;

    if (!context || !context.scenario || !context.personality || !context.setting) {
      return NextResponse.json(
        { success: false, error: 'Missing required context fields' },
        { status: 400 }
      );
    }

    const sceneDescription = await generateSceneDescription(context);

    return NextResponse.json({
      success: true,
      sceneDescription
    });
  } catch (error: any) {
    console.error('Scene generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate scene description' },
      { status: 500 }
    );
  }
} 
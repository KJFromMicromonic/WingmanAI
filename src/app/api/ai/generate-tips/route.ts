import { generateCoachingTips, TCoachingTips } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for generating coaching tips for roleplay scenarios.
 *
 * @param request HTTP request containing context for tip generation
 * @returns Coaching tips or error response
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

    const coachingTips: TCoachingTips = await generateCoachingTips(context);

    return NextResponse.json({
      success: true,
      coachingTips
    });
  } catch (error: any) {
    console.error('Coaching tips generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate coaching tips' },
      { status: 500 }
    );
  }
} 
import { generateOpeningLine } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for generating conversation opening lines.
 * 
 * Creates contextually appropriate conversation starters using Gemini AI
 * with proper server-side authentication and error handling.
 * 
 * @param request HTTP request with scenario context
 * @returns Generated opening line or error message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context } = body;

    if (!context || !context.scenario || !context.personality || !context.setting) {
      return NextResponse.json(
        { error: 'Context with scenario, personality, and setting is required' },
        { status: 400 }
      );
    }

    const openingLine = await generateOpeningLine(context);

    return NextResponse.json({
      success: true,
      openingLine
    });

  } catch (error: any) {
    console.error('Opening Line Generation Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate opening line'
    }, { status: 500 });
  }
} 
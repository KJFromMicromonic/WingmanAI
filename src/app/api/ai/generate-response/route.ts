import { generateAIResponse } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for generating AI responses.
 * 
 * Handles conversation generation using Gemini AI with proper server-side
 * authentication and error handling.
 * 
 * @param request HTTP request with prompt and context
 * @returns AI-generated response or error message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, context } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!context || !context.personality || !context.setting) {
      return NextResponse.json(
        { error: 'Context with personality and setting is required' },
        { status: 400 }
      );
    }

    const response = await generateAIResponse(prompt, context);

    return NextResponse.json({
      success: true,
      response
    });

  } catch (error: any) {
    console.error('AI Response Generation Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate AI response'
    }, { status: 500 });
  }
} 
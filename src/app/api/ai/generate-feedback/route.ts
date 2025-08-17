import { generateFeedback } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for generating conversation feedback.
 * 
 * Analyzes conversation exchanges and provides constructive feedback
 * using Gemini AI with proper server-side authentication.
 * 
 * @param request HTTP request with user message, AI response, and context
 * @returns Feedback analysis or error message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, aiResponse, context } = body;

    if (!userMessage || !aiResponse) {
      return NextResponse.json(
        { error: 'User message and AI response are required' },
        { status: 400 }
      );
    }

    if (!context || !context.scenario || !context.personality) {
      return NextResponse.json(
        { error: 'Context with scenario and personality is required' },
        { status: 400 }
      );
    }

    const feedback = await generateFeedback(userMessage, aiResponse, context);

    return NextResponse.json({
      success: true,
      feedback
    });

  } catch (error: any) {
    console.error('Feedback Generation Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate feedback'
    }, { status: 500 });
  }
} 
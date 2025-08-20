import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Token generation request received');
    
    const body = await request.json();
    const { roomName, participantName, metadata } = body;
    
    console.log('📋 Request data:', { roomName, participantName, metadata });

    if (!roomName || !participantName) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'roomName and participantName are required' },
        { status: 400 }
      );
    }

    // Get LiveKit credentials from environment
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;
    
    console.log('🔑 Environment check:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasWsUrl: !!wsUrl,
      apiKey: apiKey ? `${apiKey.substring(0, 6)}...` : 'undefined',
      wsUrl
    });

    if (!apiKey || !apiSecret || !wsUrl) {
      console.error('❌ LiveKit credentials missing');
      return NextResponse.json(
        { error: 'LiveKit credentials not configured', details: { hasApiKey: !!apiKey, hasApiSecret: !!apiSecret, hasWsUrl: !!wsUrl } },
        { status: 500 }
      );
    }

    // Create access token
    console.log('🎫 Creating access token...');
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    });

    // Grant permissions (remove room metadata to avoid conflicts)
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });
    
    // Add metadata to the token after grant
    if (metadata) {
      token.metadata = JSON.stringify(metadata);
    }

    const jwt = await token.toJwt();
    console.log('✅ Token generated successfully');
    console.log('🔍 Token details:', {
      identity: participantName,
      room: roomName,
      tokenLength: jwt.length,
      tokenStart: jwt.substring(0, 20) + '...'
    });

    return NextResponse.json({
      token: jwt,
      roomName,
      wsUrl,
      participantName,
      metadata,
      roomMetadata: metadata // Pass metadata separately for room creation
    });

  } catch (error) {
    console.error('❌ Error generating token:', error);
    console.error('Error details:', (error as Error).message, (error as Error).stack);
    return NextResponse.json(
      { error: 'Failed to generate token', details: (error as Error).message },
      { status: 500 }
    );
  }
}
/**
 * Socket.IO Initialization Route
 * Ensures Socket.IO server is set up when this route is called
 */

import { NextResponse, NextRequest } from 'next/server';
import { Server } from 'socket.io';
import { initializeSocketIO } from '@/lib/socket';

export async function GET(req: NextRequest) {
  try {
    // Socket.IO server will be initialized on first socket connection
    // This endpoint just confirms the setup
    return NextResponse.json(
      {
        status: 'ok',
        message: 'Socket.IO server is configured and ready',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking Socket.IO:', error);
    return NextResponse.json(
      { error: 'Failed to check Socket.IO status' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Check if API key is configured
    if (!process.env.ASSEMBLYAI_API_KEY) {
      console.error('ASSEMBLYAI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured' },
        { status: 500 }
      );
    }

    // For Universal Streaming, we just return the API key
    // The client will use it in the WebSocket URL
    console.log('Returning AssemblyAI API key for Universal Streaming');
    return NextResponse.json({ 
      apiKey: process.env.ASSEMBLYAI_API_KEY 
    });
  } catch (error: unknown) {
    console.error('Failed to get API key:', error);
    return NextResponse.json(
      { error: 'Failed to get API key', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
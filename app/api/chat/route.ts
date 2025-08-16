import { NextRequest, NextResponse } from 'next/server';
import { streamClaudeResponse } from '@/lib/claude';
import { ClaudeModel, DEFAULT_MODEL } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const { messages, systemPrompt, model = DEFAULT_MODEL } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamClaudeResponse(messages, systemPrompt, model as ClaudeModel)) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          const errorData = `data: ${JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            isComplete: true 
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
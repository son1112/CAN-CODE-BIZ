import { NextRequest } from 'next/server';
import { streamClaudeResponse } from '@/lib/claude';
import { ClaudeModel, DEFAULT_MODEL } from '@/lib/models';
import { handleApiError, ValidationRequestError } from '@/lib/error-handler';
import { validators } from '@/lib/validators';
import { requireAuth } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user - CRITICAL: Chat endpoint requires authentication
    const { userId } = await requireAuth(request);

    const body = await request.json();

    // Validate request body
    const validation = validators.chatRequest(body);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => `${e.field}: ${e.message}`).join(', ');
      throw new ValidationRequestError('Invalid request data', errorMessages);
    }

    const { messages, systemPrompt, model = DEFAULT_MODEL } = body;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamClaudeResponse(messages, systemPrompt, model as ClaudeModel)) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          // Ensure completion signal is sent (defense against missing completion)
          const completionData = `data: ${JSON.stringify({ content: '', isComplete: true })}\n\n`;
          controller.enqueue(encoder.encode(completionData));
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
    return handleApiError(error, 'chat-api');
  }
}
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError, ValidationRequestError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';

interface LocalTextExportRequest {
  messageId: string;
  sessionId: string;
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await requireAuth(request);

    await connectDB();

    // Parse and validate request
    const body = await request.json() as LocalTextExportRequest;
    const { messageId, sessionId, includeMetadata = true, includeTimestamp = true } = body;

    if (!messageId || !sessionId) {
      throw new ValidationRequestError('Missing required fields: messageId or sessionId');
    }

    logger.info('Local text export requested', {
      component: 'export-text-local-api',
      userId,
      messageId,
      sessionId
    });

    // Find the session and verify ownership
    const session = await Session.findOne({
      sessionId,
      createdBy: userId
    });

    if (!session) {
      logger.error('Session not found for export', {
        component: 'export-text-local-api',
        userId,
        sessionId,
        messageId
      });
      return new Response('Session not found', { status: 404 });
    }

    // Find the specific message
    const message = session.messages.find((msg: { _id?: { toString(): string }; id?: string }) =>
      msg._id?.toString() === messageId || msg.id === messageId
    );
    if (!message) {
      logger.error('Message not found in session', {
        component: 'export-text-local-api',
        userId,
        sessionId,
        messageId,
        messageCount: session.messages.length
      });
      return new Response('Message not found', { status: 404 });
    }

    // Generate text content
    let textContent = '';

    // Add header with metadata
    if (includeMetadata) {
      textContent += `RUBBER DUCKY LIVE - MESSAGE EXPORT\n`;
      textContent += `==========================================\n\n`;
      textContent += `Session: ${session.name}\n`;
      textContent += `Message ID: ${messageId}\n`;
      if (message.agentUsed) {
        textContent += `Agent: ${message.agentUsed}\n`;
      }
      if (includeTimestamp && message.timestamp) {
        const timestamp = new Date(message.timestamp).toLocaleString();
        textContent += `Timestamp: ${timestamp}\n`;
      }
      if (message.tags && message.tags.length > 0) {
        textContent += `Tags: ${message.tags.join(', ')}\n`;
      }
      textContent += `\n==========================================\n\n`;
    }

    // Add message role indicator
    const roleIndicator = message.role === 'user' ? 'USER' : 'ASSISTANT';
    textContent += `[${roleIndicator}]\n`;

    // Add message content
    textContent += message.content;

    // Add footer
    if (includeMetadata) {
      textContent += `\n\n==========================================\n`;
      textContent += `Exported from Rubber Ducky Live\n`;
      textContent += `Export Date: ${new Date().toLocaleString()}\n`;
      textContent += `Website: https://rubber-ducky-live.vercel.app/\n`;
    }

    logger.info('Local text export completed successfully', {
      component: 'export-text-local-api',
      userId,
      messageId,
      sessionId,
      contentLength: textContent.length
    });

    // Return text as download
    const fileName = `${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_${messageId.slice(-8)}_${Date.now()}.txt`;

    return new Response(textContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': Buffer.byteLength(textContent, 'utf8').toString()
      }
    });

  } catch (error) {
    return handleApiError(error, 'export-text-local-api');
  }
}
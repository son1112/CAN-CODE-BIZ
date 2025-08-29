import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError, ValidationRequestError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { generateMessagePDF } from '@/lib/export/pdf-generator';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';

interface LocalExportRequest {
  messageId: string;
  sessionId: string;
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
  includeBranding?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await requireAuth(request);

    await connectDB();

    // Parse and validate request
    const body = await request.json() as LocalExportRequest;
    const { messageId, sessionId, includeMetadata = true, includeTimestamp = true, includeBranding = true } = body;

    // Debug logging to identify the exact issue
    logger.debug('PDF export request validation', {
      component: 'export-pdf-local-api',
      messageId,
      sessionId,
      messageIdType: typeof messageId,
      sessionIdType: typeof sessionId,
      messageIdTruthy: !!messageId,
      sessionIdTruthy: !!sessionId,
      bodyKeys: Object.keys(body)
    });

    if (!messageId || !sessionId) {
      logger.error('Validation failed - missing required fields', {
        component: 'export-pdf-local-api',
        messageId: messageId || 'MISSING',
        sessionId: sessionId || 'MISSING',
        bodyKeys: Object.keys(body).join(', ')
      });
      throw new ValidationRequestError('Missing required fields: messageId or sessionId');
    }

    logger.info('Local PDF export requested', {
      component: 'export-pdf-local-api',
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
        component: 'export-pdf-local-api',
        userId,
        sessionId,
        messageId
      });
      return new Response('Session not found', { status: 404 });
    }

    // Find the specific message (check both _id and id fields)
    const message = session.messages.find((msg: { _id?: { toString(): string }; id?: string }) =>
      msg._id?.toString() === messageId || msg.id === messageId
    );
    if (!message) {
      logger.error('Message not found in session', {
        component: 'export-pdf-local-api',
        userId,
        sessionId,
        messageId,
        messageCount: session.messages.length,
        availableMessageIds: session.messages.map((m: { _id?: { toString(): string } }) => m._id?.toString()).slice(0, 5),
        availableIds: session.messages.map((m: { id?: string }) => m.id).slice(0, 5)
      });
      return new Response('Message not found', { status: 404 });
    }

    // Prepare message data for export
    const messageData = {
      messageId: message._id?.toString() || messageId,
      content: message.content,
      role: message.role,
      timestamp: message.timestamp,
      sessionName: session.name,
      agentUsed: message.agentUsed,
      tags: message.tags
    };

    // Generate PDF
    const pdfBuffer = await generateMessagePDF(messageData, {
      includeMetadata,
      includeTimestamp,
      includeBranding
    });

    logger.info('Local PDF export completed successfully', {
      component: 'export-pdf-local-api',
      userId,
      messageId,
      sessionId,
      documentSize: pdfBuffer.length
    });

    // Return PDF as download
    const fileName = `${session.name.replace(/[^a-zA-Z0-9]/g, '_')}_${messageId.slice(-8)}_${Date.now()}.pdf`;

    return new Response(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    return handleApiError(error, 'export-pdf-local-api');
  }
}
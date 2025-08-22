import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    const { messageId } = await params;
    const { isArchived, sessionId } = await req.json();

    if (!messageId || !sessionId) {
      return NextResponse.json(
        { error: 'Message ID and Session ID are required' },
        { status: 400 }
      );
    }

    logger.info('Toggling message archive status', {
      component: 'ArchiveMessageAPI',
      userId,
      messageId,
      sessionId,
      isArchived
    });

    await connectDB();

    // Find the session and update the specific message
    const session = await Session.findOne({
      sessionId,
      createdBy: userId
    });

    if (!session) {
      logger.warn('Session not found for archive operation', {
        component: 'ArchiveMessageAPI',
        userId,
        sessionId
      });
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Find and update the message
    const message = session.messages.find((msg: any) => msg.id === messageId);
    
    if (!message) {
      logger.warn('Message not found for archive operation', {
        component: 'ArchiveMessageAPI',
        userId,
        messageId,
        sessionId
      });
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Update archive status
    message.isArchived = isArchived;
    message.archivedAt = isArchived ? new Date() : undefined;

    // Save the session
    await session.save();

    logger.info('Message archive status updated successfully', {
      component: 'ArchiveMessageAPI',
      userId,
      messageId,
      sessionId,
      isArchived
    });

    return NextResponse.json({
      success: true,
      messageId,
      isArchived,
      archivedAt: message.archivedAt
    });

  } catch (error) {
    logger.error('Failed to toggle message archive status', {
      component: 'ArchiveMessageAPI'
    }, error);

    return NextResponse.json(
      { error: 'Failed to update message archive status' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import Session from '@/models/Session';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);

    const { id: sessionId } = await context.params;
    const { isFavorite } = await req.json();

    logger.info('Toggling session favorite', {
      component: 'SessionFavoriteAPI',
      sessionId,
      userId,
      isFavorite
    });

    const session = await Session.findOneAndUpdate(
      {
        sessionId,
        createdBy: userId
      },
      {
        isFavorite: Boolean(isFavorite),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!session) {
      logger.warn('Session not found for favorite toggle', {
        component: 'SessionFavoriteAPI',
        sessionId,
        userId
      });
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    logger.info('Session favorite toggled successfully', {
      component: 'SessionFavoriteAPI',
      sessionId,
      isFavorite: session.isFavorite
    });

    return NextResponse.json({
      success: true,
      isFavorite: session.isFavorite
    });

  } catch (error) {
    const { id: sessionId } = await context.params.catch(() => ({ id: 'unknown' }));

    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    logger.error('Failed to toggle session favorite', {
      component: 'SessionFavoriteAPI',
      sessionId
    }, error);

    return NextResponse.json(
      { error: 'Failed to update favorite status' },
      { status: 500 }
    );
  }
}
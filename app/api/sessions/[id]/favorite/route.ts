import { NextRequest, NextResponse } from 'next/server';
import Session from '@/models/Session';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;
    const { isFavorite } = await req.json();

    logger.info('Toggling session favorite', {
      component: 'SessionFavoriteAPI',
      sessionId,
      userId: user.id,
      isFavorite
    });

    const session = await Session.findOneAndUpdate(
      { 
        sessionId, 
        createdBy: user.id 
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
        userId: user.id
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
    logger.error('Failed to toggle session favorite', {
      component: 'SessionFavoriteAPI',
      sessionId: params.id
    }, error);

    return NextResponse.json(
      { error: 'Failed to update favorite status' },
      { status: 500 }
    );
  }
}
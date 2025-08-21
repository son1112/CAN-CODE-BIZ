import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth(req);
    const { sessionId, isFavorite } = await req.json();

    if (!sessionId || typeof isFavorite !== 'boolean') {
      return NextResponse.json(
        { error: 'Session ID and favorite status are required' },
        { status: 400 }
      );
    }

    await connectDB();

    logger.info('Toggling session favorite', {
      component: 'FavoritesAPI',
      userId,
      sessionId,
      isFavorite
    });

    const session = await Session.findOneAndUpdate(
      { sessionId, createdBy: userId },
      { isFavorite },
      { new: true }
    );

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    logger.info('Session favorite toggled successfully', {
      component: 'FavoritesAPI',
      userId,
      sessionId,
      isFavorite
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        isFavorite: session.isFavorite
      }
    });

  } catch (error) {
    logger.error('Failed to toggle session favorite', {
      component: 'FavoritesAPI'
    }, error);

    return NextResponse.json(
      { error: 'Failed to update favorite status' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth(req);
    
    await connectDB();

    logger.info('Fetching favorite sessions', {
      component: 'FavoritesAPI',
      userId
    });

    const favoriteSessions = await Session.find({
      createdBy: userId,
      isFavorite: true,
      isArchived: false
    })
      .select('sessionId name createdAt updatedAt lastAccessedAt messages avatar')
      .sort({ updatedAt: -1 })
      .limit(50);

    const sessionsWithCounts = favoriteSessions.map(session => ({
      ...session.toObject(),
      messageCount: session.messages.length
    }));

    logger.info('Favorite sessions fetched successfully', {
      component: 'FavoritesAPI',
      userId,
      count: favoriteSessions.length
    });

    return NextResponse.json({
      success: true,
      data: sessionsWithCounts
    });

  } catch (error) {
    logger.error('Failed to fetch favorite sessions', {
      component: 'FavoritesAPI'
    }, error);

    return NextResponse.json(
      { error: 'Failed to fetch favorite sessions' },
      { status: 500 }
    );
  }
}
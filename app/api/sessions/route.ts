import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

// GET /api/sessions - List user sessions with pagination/filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const archived = searchParams.get('archived') === 'true';

    // Build query
    const query: Record<string, any> = {
      createdBy: session.user.id,
      isArchived: archived
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'messages.content': { $regex: search, $options: 'i' } }
      ];
    }

    if (tags.length > 0) {
      query.$or = query.$or || [];
      query.$or.push(
        { tags: { $in: tags } }, // Session-level tags
        { 'messages.tags': { $in: tags } } // Message-level tags
      );
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sessions = await Session.find(query)
      .select('sessionId name createdAt updatedAt lastAccessedAt tags messages iterationCount')
      .sort({ lastAccessedAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Session.countDocuments(query);

    // Add preview message for each session
    const sessionsWithPreview = sessions.map(session => ({
      ...session,
      messageCount: session.messages?.length || 0,
      lastMessage: session.messages?.[session.messages.length - 1]?.content || '',
      hasIterations: (session.iterationCount || 0) > 0
    }));

    return NextResponse.json({
      sessions: sessionsWithPreview,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, tags = [], conversationStarter } = body;

    // Auto-generate name if not provided
    const sessionName = name || `Chat ${new Date().toLocaleString()}`;
    const sessionId = uuidv4();

    // Check if session name already exists for this user
    const existingSession = await Session.findOne({
      name: sessionName,
      createdBy: session.user.id
    });

    if (existingSession) {
      return NextResponse.json(
        { error: 'Session name already exists' },
        { status: 409 }
      );
    }

    const newSession = new Session({
      sessionId,
      name: sessionName,
      createdBy: session.user.id,
      tags,
      conversationStarter,
      messages: [],
      iterations: [],
      isActive: true,
      isArchived: false
    });

    await newSession.save();

    return NextResponse.json({
      success: true,
      session: {
        sessionId: newSession.sessionId,
        name: newSession.name,
        createdAt: newSession.createdAt,
        tags: newSession.tags
      }
    });

  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
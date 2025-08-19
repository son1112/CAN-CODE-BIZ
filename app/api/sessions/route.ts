import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

// Random avatar selection for new sessions
function getRandomAvatar(): { imageUrl: string; prompt: string } {
  const avatars = [
    { 
      imageUrl: '/mock-avatars/Gemini_Generated_Image_f3qn6af3qn6af3qn.png', 
      prompt: 'Smart Tech Duck - Perfect for debugging and development conversations' 
    },
    { 
      imageUrl: '/mock-avatars/Gemini_Generated_Image_ir5hzair5hzair5h.png', 
      prompt: 'Voice Bubble Duck - Great for general conversations and rubber duck debugging' 
    },
    { 
      imageUrl: '/mock-avatars/Gemini_Generated_Image_ksuug0ksuug0ksuu (1).png', 
      prompt: 'Minimal Tech Duck - Clean design for focused problem-solving sessions' 
    },
    { 
      imageUrl: '/mock-avatars/default-duck.png', 
      prompt: 'Classic Friendly Duck - Your traditional rubber duck companion' 
    }
  ];
  
  const randomIndex = Math.floor(Math.random() * avatars.length);
  return avatars[randomIndex];
}

// GET /api/sessions - List user sessions with pagination/filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Demo mode bypass for testing
    const isDemoMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const userId = isDemoMode ? 'demo-user' : session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    // Validate and sanitize query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20'))); // Limit between 1-100
    const search = searchParams.get('search')?.trim().slice(0, 200) || ''; // Limit search length
    const tags = searchParams.get('tags')?.split(',').filter(Boolean).slice(0, 10) || []; // Max 10 tags
    const archived = searchParams.get('archived') === 'true';

    // Validate page parameter
    if (isNaN(page) || page < 1) {
      logger.warn('Invalid page parameter', { component: 'sessions-api', page: searchParams.get('page') });
      return NextResponse.json(
        { error: 'Invalid page parameter' },
        { status: 400 }
      );
    }

    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 100) {
      logger.warn('Invalid limit parameter', { component: 'sessions-api', limit: searchParams.get('limit') });
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Build query
    const query: Record<string, unknown> = {
      createdBy: userId,
      isArchived: archived
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'messages.content': { $regex: search, $options: 'i' } }
      ];
    }

    if (tags.length > 0) {
      (query as Record<string, unknown>).$or = (query as Record<string, unknown>).$or || [];
      ((query as Record<string, unknown>).$or as unknown[]).push(
        { tags: { $in: tags } }, // Session-level tags
        { 'messages.tags': { $in: tags } } // Message-level tags
      );
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sessions = await Session.find(query)
      .select('sessionId name createdAt updatedAt lastAccessedAt tags messages iterationCount avatar')
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
    logger.error('Failed to list sessions', { component: 'sessions-api' }, error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database request timeout' },
          { status: 504 }
        );
      }
      if (error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection error' },
          { status: 503 }
        );
      }
    }
    
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
    
    // Demo mode bypass for testing
    const isDemoMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const userId = isDemoMode ? 'demo-user' : session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, tags = [], conversationStarter } = body;

    // Validate input data
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      logger.warn('Invalid session name provided', { component: 'sessions-api' });
      return NextResponse.json(
        { error: 'Session name must be a non-empty string' },
        { status: 400 }
      );
    }

    if (name && name.length > 200) {
      logger.warn('Session name too long', { component: 'sessions-api', nameLength: name.length });
      return NextResponse.json(
        { error: 'Session name must be less than 200 characters' },
        { status: 400 }
      );
    }

    if (!Array.isArray(tags)) {
      logger.warn('Invalid tags format', { component: 'sessions-api' });
      return NextResponse.json(
        { error: 'Tags must be an array' },
        { status: 400 }
      );
    }

    if (tags.length > 10) {
      logger.warn('Too many tags provided', { component: 'sessions-api', tagCount: tags.length });
      return NextResponse.json(
        { error: 'Maximum 10 tags allowed' },
        { status: 400 }
      );
    }

    // Validate tag strings
    const invalidTag = tags.find(tag => typeof tag !== 'string' || tag.trim().length === 0 || tag.length > 50);
    if (invalidTag !== undefined) {
      logger.warn('Invalid tag format', { component: 'sessions-api', invalidTag });
      return NextResponse.json(
        { error: 'Each tag must be a non-empty string with less than 50 characters' },
        { status: 400 }
      );
    }

    if (conversationStarter && (typeof conversationStarter !== 'string' || conversationStarter.length > 1000)) {
      logger.warn('Invalid conversation starter', { component: 'sessions-api' });
      return NextResponse.json(
        { error: 'Conversation starter must be a string with less than 1000 characters' },
        { status: 400 }
      );
    }

    const sessionId = uuidv4();
    
    // Auto-generate unique name if not provided
    const sessionName = name || `Chat ${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}-${sessionId.slice(-6)}`;

    // Only check for name collisions with user-provided names
    if (name) {
      const existingSession = await Session.findOne({
        name: sessionName,
        createdBy: userId
      });

      if (existingSession) {
        return NextResponse.json(
          { error: 'Session name already exists' },
          { status: 409 }
        );
      }
    }

    // Assign a random avatar to the new session
    const randomAvatar = getRandomAvatar();

    const newSession = new Session({
      sessionId,
      name: sessionName,
      createdBy: userId,
      tags,
      conversationStarter,
      messages: [],
      iterations: [],
      isActive: true,
      isArchived: false,
      avatar: {
        imageUrl: randomAvatar.imageUrl,
        prompt: randomAvatar.prompt,
        generatedAt: new Date()
      }
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
    logger.error('Failed to create session', { component: 'sessions-api' }, error);
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Session name already exists' },
          { status: 409 }
        );
      }
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: 'Invalid session data' },
          { status: 400 }
        );
      }
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database request timeout' },
          { status: 504 }
        );
      }
      if (error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection error' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
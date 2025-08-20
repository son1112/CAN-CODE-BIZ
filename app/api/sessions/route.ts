import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { ApiResponse, createPagination, sanitizePagination } from '@/lib/api-response';
import { handleApiError, validateRequest } from '@/lib/error-handler';
import { validators } from '@/lib/validators';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

// Simplified avatar selection for new sessions
function getRandomAvatar(): { imageUrl: string; prompt: string } {
  // Use consistent avatar for simplicity
  return {
    imageUrl: '/Gemini_Generated_Image_35trpk35trpk35tr.png',
    prompt: 'Rubber Duck Companion - Your friendly AI assistant for thinking out loud'
  };
}

// GET /api/sessions - List user sessions with pagination/filtering
export async function GET(request: NextRequest) {
  try {
    // Use authentication middleware
    const { userId } = await requireAuth(request);

    await connectDB();

    const { searchParams } = request.nextUrl;
    
    // Use standardized pagination validation
    const { page, limit, skip } = sanitizePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      20, // default limit
      100  // max limit
    );
    
    // Validate and sanitize search parameters
    const search = searchParams.get('search')?.trim().slice(0, 200) || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean).slice(0, 10) || [];
    const archived = searchParams.get('archived') === 'true';

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

    // Create standardized pagination metadata
    const pagination = createPagination(page, limit, totalCount);

    logger.info('Sessions retrieved successfully', {
      component: 'sessions-api',
      userId,
      sessionCount: sessions.length,
      totalCount,
      page,
      limit
    });

    // Return in the format expected by the frontend for backward compatibility
    return NextResponse.json({
      sessions: sessionsWithPreview,
      pagination: pagination
    });

  } catch (error) {
    return handleApiError(error, 'sessions-api');
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    // Use authentication middleware
    const { userId } = await requireAuth(request);

    await connectDB();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(body, validators.createSession, 'sessions-api');

    const { name, tags = [], conversationStarter } = validatedData as { name?: string; tags?: string[]; conversationStarter?: string };
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
        return ApiResponse.conflict('Session name already exists');
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

    logger.info('Session created successfully', {
      component: 'sessions-api',
      userId,
      sessionId: newSession.sessionId,
      sessionName: newSession.name
    });

    // Return in the format expected by the frontend for backward compatibility
    return NextResponse.json({
      success: true,
      session: {
        sessionId: newSession.sessionId,
        name: newSession.name,
        createdAt: newSession.createdAt,
        tags: newSession.tags,
        avatar: newSession.avatar
      }
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error, 'sessions-api');
  }
}
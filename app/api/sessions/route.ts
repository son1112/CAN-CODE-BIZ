import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const archived = searchParams.get('archived') === 'true';

    // Build query
    const query: Record<string, any> = {
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
      query.$or = query.$or || [];
      query.$or.push(
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
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
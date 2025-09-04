import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

// POST /api/sessions/[id]/messages - Add message to session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use consistent authentication middleware
    const { userId } = await requireAuth(request);

    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const { role, content, audioMetadata, agentUsed } = body;

    // Validate required fields
    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be user, assistant, or system' },
        { status: 400 }
      );
    }

    const newMessage = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      audioMetadata,
      agentUsed
    };

    // Find and update session
    const updatedSession = await Session.findOneAndUpdate(
      {
        sessionId: id,
        createdBy: userId
      },
      {
        $push: { messages: newMessage },
        $set: {
          lastAccessedAt: new Date(),
          lastAgentUsed: agentUsed || undefined
        }
      },
      { new: true, lean: true }
    );

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
      messageCount: (updatedSession as { messages?: unknown[] })?.messages?.length || 0
    });

  } catch (error) {
    console.error('Add message error:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}

// GET /api/sessions/[id]/messages - Get session messages with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const sessionDoc = await Session.findOne({
      sessionId: id,
      createdBy: session.user.id
    }).lean();

    if (!sessionDoc) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Paginate messages
    const totalMessages = (sessionDoc as { messages?: unknown[] })?.messages?.length || 0;
    const skip = Math.max(0, totalMessages - (page * limit));
    const take = Math.min(limit, totalMessages - skip);

    const messages = ((sessionDoc as { messages?: unknown[] })?.messages || []).slice(skip, skip + take);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        totalCount: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
        hasNext: skip > 0,
        hasPrev: totalMessages > page * limit
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    // Get user
    const { userId } = await requireAuth(request);

    // Find session and filter for pinned messages
    const session = await Session.findOne(
      { sessionId: id, createdBy: userId },
      { messages: 1, name: 1, sessionId: 1 }
    );

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Filter for pinned messages and sort by pinnedAt date (most recent first)
    const pinnedMessages = session.messages
      .filter((msg: any) => msg.isPinned === true)
      .sort((a: any, b: any) => {
        if (!a.pinnedAt) return 1;
        if (!b.pinnedAt) return -1;
        return new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime();
      });

    return NextResponse.json({ 
      sessionId: session.sessionId,
      sessionName: session.name,
      pinnedMessages,
      count: pinnedMessages.length
    });

  } catch (error) {
    console.error('Error fetching pinned messages:', error);
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
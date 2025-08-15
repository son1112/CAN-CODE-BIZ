import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';

// PUT /api/sessions/[id]/rename - Rename a session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Valid session name is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and update the session
    const updatedSession = await Session.findOneAndUpdate(
      { 
        sessionId: id,
        createdBy: session.user.id
      },
      { 
        name: name.trim(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId: updatedSession.sessionId,
        name: updatedSession.name,
        updatedAt: updatedSession.updatedAt
      }
    });

  } catch (error) {
    console.error('Session rename error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to rename session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
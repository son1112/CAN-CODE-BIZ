import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import { requireAuth } from '@/lib/middleware/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Get user
    const { userId } = await requireAuth(request);
    const body = await request.json();
    const { primaryAgent } = body;

    // Validate primaryAgent if provided
    if (primaryAgent !== null && primaryAgent !== undefined && typeof primaryAgent !== 'string') {
      return NextResponse.json(
        { error: 'Primary agent must be a string or null' },
        { status: 400 }
      );
    }

    // Update session
    const updateData: { primaryAgent?: string; $unset?: { primaryAgent: string } } = {};
    if (primaryAgent) {
      updateData.primaryAgent = primaryAgent;
    } else {
      updateData.$unset = { primaryAgent: "" };
    }

    const updatedSession = await Session.findOneAndUpdate(
      { sessionId: id, createdBy: userId },
      primaryAgent ? { $set: updateData } : updateData,
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: updatedSession.toObject(),
      message: 'Primary agent updated successfully'
    });

  } catch (error) {
    console.error('Error updating primary agent:', error);
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
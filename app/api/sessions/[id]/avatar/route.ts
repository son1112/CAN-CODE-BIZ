import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use consistent authentication middleware
    const { userId } = await requireAuth(request);

    await connectDB();

    const { id: sessionId } = await params;
    const { imageUrl, prompt } = await request.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Image URL and prompt are required' },
        { status: 400 }
      );
    }

    // Find and update the session
    const updatedSession = await Session.findOneAndUpdate(
      {
        sessionId,
        createdBy: userId
      },
      {
        avatar: {
          imageUrl,
          prompt,
          generatedAt: new Date()
        }
      },
      { new: true, select: 'sessionId name avatar' }
    );

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: updatedSession.sessionId,
      avatar: updatedSession.avatar
    });

  } catch (error) {
    console.error('Update session avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to update session avatar' },
      { status: 500 }
    );
  }
}
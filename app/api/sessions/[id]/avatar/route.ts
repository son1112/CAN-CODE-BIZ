import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Demo mode bypass for testing
    const isDemoMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    // After migration, always use the real user ID for data consistency
    const userId = isDemoMode ? '68a33c99df2098d5e02a84e3' : session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';

// GET /api/sessions/[id] - Retrieve specific session with full data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const sessionDoc = await Session.findOne({
      sessionId: id,
      createdBy: userId
    }).lean();

    if (!sessionDoc) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update last accessed time
    await Session.updateOne(
      { sessionId: id },
      { lastAccessedAt: new Date() }
    );

    return NextResponse.json({
      session: sessionDoc
    });

  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id] - Update session metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const body = await request.json();
    const { name, tags, isArchived } = body;

    // Build update object
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (tags !== undefined) update.tags = tags;
    if (isArchived !== undefined) update.isArchived = isArchived;

    // Check if new name conflicts with existing sessions
    if (name) {
      const existingSession = await Session.findOne({
        name,
        createdBy: userId,
        sessionId: { $ne: id }
      });

      if (existingSession) {
        return NextResponse.json(
          { error: 'Session name already exists' },
          { status: 409 }
        );
      }
    }

    const updatedSession = await Session.findOneAndUpdate(
      {
        sessionId: id,
        createdBy: userId
      },
      update,
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
      session: updatedSession
    });

  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Archive/delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // Permanently delete
      const result = await Session.deleteOne({
        sessionId: id,
        createdBy: userId
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
    } else {
      // Soft delete (archive)
      const result = await Session.updateOne(
        {
          sessionId: id,
          createdBy: userId
        },
        {
          isArchived: true,
          isActive: false
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Session permanently deleted' : 'Session archived'
    });

  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import { requireAuth } from '@/lib/middleware/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    await connectDB();
    const { messageId } = await params;
    
    // Get user
    const { userId } = await requireAuth(request);
    
    const body = await request.json();
    const { isPinned } = body;

    // Validate isPinned parameter
    if (typeof isPinned !== 'boolean') {
      return NextResponse.json(
        { error: 'isPinned must be a boolean value' },
        { status: 400 }
      );
    }

    // Find the session containing this message and update it
    const updateField = isPinned 
      ? { 'messages.$.isPinned': true, 'messages.$.pinnedAt': new Date() }
      : { 'messages.$.isPinned': false, 'messages.$.pinnedAt': null };

    const updatedSession = await Session.findOneAndUpdate(
      { 
        'messages.id': messageId,
        createdBy: userId 
      },
      { $set: updateField },
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Message not found or access denied' },
        { status: 404 }
      );
    }

    // Find the updated message
    const updatedMessage = updatedSession.messages.find((msg: any) => msg.id === messageId);

    return NextResponse.json({ 
      message: updatedMessage,
      success: true,
      action: isPinned ? 'pinned' : 'unpinned'
    });

  } catch (error) {
    console.error('Error updating message pin status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
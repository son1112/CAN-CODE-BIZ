import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import Tag from '@/models/Tag';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { userId } = await requireAuth(request);

    const { tags } = await request.json();
    
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Tags must be an array' }, { status: 400 });
    }

    await connectDB();

    const { messageId } = await params;

    // Auto-create tags that don't exist yet
    for (const tagName of tags) {
      const trimmedTag = tagName.toLowerCase().trim();
      if (trimmedTag) {
        console.log(`Creating/updating tag: ${trimmedTag} for user: ${userId}`);
        
        // Check if tag exists first
        const existingTag = await Tag.findOne({
          name: trimmedTag,
          userId: userId
        });

        if (existingTag) {
          // Tag exists, just increment usage
          await Tag.findByIdAndUpdate(existingTag._id, {
            $inc: { usageCount: 1 }
          });
          console.log(`Incremented usage for existing tag: ${trimmedTag}`);
        } else {
          // Create new tag
          const newTag = new Tag({
            name: trimmedTag,
            color: '#3B82F6',
            userId: userId,
            usageCount: 1
          });
          await newTag.save();
          console.log(`Created new tag: ${trimmedTag}`);
        }
      }
    }

    // Find the session containing the message and update the specific message's tags
    const sessionDoc = await Session.findOneAndUpdate(
      { 
        'messages.id': messageId,
        createdBy: userId 
      },
      { 
        $set: { 'messages.$.tags': tags },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!sessionDoc) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Find the updated message to return
    const updatedMessage = sessionDoc.messages.find(
      (msg: { id: string }) => msg.id === messageId
    );

    return NextResponse.json({ 
      success: true,
      message: updatedMessage 
    });

  } catch (error) {
    console.error('Error updating message tags:', error);
    return NextResponse.json(
      { error: 'Failed to update message tags' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { userId } = await requireAuth(request);

    await connectDB();

    const { messageId } = await params;

    // Find the session containing the message
    const sessionDoc = await Session.findOne(
      { 
        'messages.id': messageId,
        createdBy: userId 
      },
      { 'messages.$': 1 }
    );

    if (!sessionDoc || !sessionDoc.messages.length) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const message = sessionDoc.messages[0];
    return NextResponse.json({ 
      tags: message.tags || [],
      messageId: messageId
    });

  } catch (error) {
    console.error('Error fetching message tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message tags' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Tag from '@/models/Tag';
import Conversation from '@/models/Conversation';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { id } = await params;

    const body = await request.json();
    const { name, color, category, description } = body;

    const tag = await Tag.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        ...(name && { name: name.toLowerCase().trim() }),
        ...(color && { color }),
        ...(category !== undefined && { category: category?.toLowerCase().trim() }),
        ...(description !== undefined && { description: description?.trim() })
      },
      { new: true, runValidators: true }
    );

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { id } = await params;

    const tag = await Tag.findOneAndDelete({
      _id: id,
      userId: session.user.id
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Remove tag references from conversations
    await Conversation.updateMany(
      { userId: session.user.id },
      {
        $pull: {
          'metadata.tags': tag.name,
          'messages.$[].tags': tag.name
        }
      }
    );

    return NextResponse.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
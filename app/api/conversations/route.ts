import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    const query = userId ? { userId } : {};
    
    const conversations = await Conversation
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v');

    const total = await Conversation.countDocuments(query);

    return NextResponse.json({
      conversations,
      total,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, messages, metadata } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const conversation = new Conversation({
      userId,
      messages,
      metadata,
    });

    await conversation.save();

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { conversationId, messages } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { 
        messages,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
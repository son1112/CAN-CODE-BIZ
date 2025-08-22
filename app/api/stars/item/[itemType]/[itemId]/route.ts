import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Star from '@/models/Star';
import { StarableType } from '@/models/Star';

// DELETE /api/stars/item/[itemType]/[itemId] - Unstar an item by type and ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemType: string; itemId: string }> }
) {
  try {
    await connectDB();
    
    const { itemType, itemId } = await params;
    
    // Get userId from request body for DELETE requests
    let userId: string;
    try {
      const body = await request.json();
      userId = body.userId;
    } catch {
      // Fallback to query params
      const { searchParams } = new URL(request.url);
      userId = searchParams.get('userId') || '';
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Validate itemType
    const validItemTypes: StarableType[] = [
      'message', 
      'session', 
      'agent', 
      'conversation-starter', 
      'code-snippet'
    ];
    
    if (!validItemTypes.includes(itemType as StarableType)) {
      return NextResponse.json(
        { error: 'Invalid itemType' },
        { status: 400 }
      );
    }
    
    const star = await Star.findOneAndDelete({
      userId,
      itemType: itemType as StarableType,
      itemId,
    });

    if (!star) {
      return NextResponse.json(
        { error: 'Star not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Item unstarred successfully' });
  } catch (error) {
    console.error('Error unstarring item:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to unstar item' },
      { status: 500 }
    );
  }
}

// GET /api/stars/item/[itemType]/[itemId] - Check if an item is starred
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemType: string; itemId: string }> }
) {
  try {
    await connectDB();
    
    const { itemType, itemId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const star = await Star.findOne({
      userId,
      itemType: itemType as StarableType,
      itemId,
    });

    return NextResponse.json({ 
      isStarred: !!star,
      star: star || null,
    });
  } catch (error) {
    console.error('Error checking star status:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to check star status' },
      { status: 500 }
    );
  }
}
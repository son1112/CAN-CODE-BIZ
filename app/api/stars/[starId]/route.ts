import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Star from '@/models/Star';

// PUT /api/stars/[starId] - Update a star
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ starId: string }> }
) {
  try {
    await connectDB();
    
    const { starId } = await params;
    const updates = await request.json();
    
    // Remove fields that shouldn't be updated directly
    const { starId: _starIdUpdate, userId: _userIdUpdate, itemType: _itemTypeUpdate, itemId: _itemIdUpdate, ...allowedUpdates } = updates;
    // These fields are ignored for security
    void _starIdUpdate; void _userIdUpdate; void _itemTypeUpdate; void _itemIdUpdate;
    
    const star = await Star.findOneAndUpdate(
      { starId },
      { 
        ...allowedUpdates,
        lastAccessedAt: new Date(),
      },
      { new: true }
    );

    if (!star) {
      return NextResponse.json(
        { error: 'Star not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ star });
  } catch (error) {
    console.error('Error updating star:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to update star' },
      { status: 500 }
    );
  }
}

// DELETE /api/stars/[starId] - Delete a star
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ starId: string }> }
) {
  try {
    await connectDB();
    
    const { starId } = await params;
    
    const star = await Star.findOneAndDelete({ starId });

    if (!star) {
      return NextResponse.json(
        { error: 'Star not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Star deleted successfully' });
  } catch (error) {
    console.error('Error deleting star:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to delete star' },
      { status: 500 }
    );
  }
}
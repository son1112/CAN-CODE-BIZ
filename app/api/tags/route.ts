import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Tag from '@/models/Tag';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'usageCount'; // 'usageCount', 'name', 'createdAt'
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    const query: Record<string, unknown> = { userId: session.user.id };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Build sort
    const sortOptions: Record<string, number> = {};
    switch (sortBy) {
      case 'name':
        sortOptions.name = 1;
        break;
      case 'createdAt':
        sortOptions.createdAt = -1;
        break;
      case 'usageCount':
      default:
        sortOptions.usageCount = -1;
        break;
    }

    const tags = await Tag.find(query)
      .sort(sortOptions as Record<string, 1 | -1>)
      .limit(limit)
      .lean();

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, color, category, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Check if tag already exists for this user
    const existingTag = await Tag.findOne({
      userId: session.user.id,
      name: name.toLowerCase().trim()
    });

    if (existingTag) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
    }

    const tag = new Tag({
      name: name.toLowerCase().trim(),
      color: color || '#3B82F6',
      category: category?.toLowerCase().trim(),
      description: description?.trim(),
      userId: session.user.id,
      usageCount: 0
    });

    await tag.save();

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
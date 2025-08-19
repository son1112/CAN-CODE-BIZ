import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Star from '@/models/Star';
import { CreateStarOptions, deriveCategory } from '@/lib/stars';

// POST /api/stars - Create a new star
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const options: CreateStarOptions = await request.json();
    
    // Validate required fields
    if (!options.userId || !options.itemType || !options.itemId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, itemType, itemId' },
        { status: 400 }
      );
    }

    // Check if already starred
    const existingStar = await Star.findOne({
      userId: options.userId,
      itemType: options.itemType,
      itemId: options.itemId,
    });

    if (existingStar) {
      return NextResponse.json(
        { error: 'Item is already starred' },
        { status: 409 }
      );
    }

    // Auto-derive category if not provided
    const category = deriveCategory(options.itemType, options.context);

    // Generate starId
    const starId = `star_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new star
    const star = new Star({
      starId,
      userId: options.userId,
      itemType: options.itemType,
      itemId: options.itemId,
      context: options.context,
      tags: options.tags || [],
      category,
      priority: options.priority || 'medium',
    });

    await star.save();

    return NextResponse.json({ star }, { status: 201 });
  } catch (error) {
    console.error('Error creating star:', error);
    return NextResponse.json(
      { error: 'Failed to create star' },
      { status: 500 }
    );
  }
}

// GET /api/stars - Get user's stars with filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Build filter object
    const filters: Record<string, unknown> = { userId };
    
    const itemType = searchParams.get('itemType');
    if (itemType) filters.itemType = itemType;
    
    const priority = searchParams.get('priority');
    if (priority) filters.priority = priority;
    
    const category = searchParams.get('category');
    if (category) filters.category = category;
    
    const tags = searchParams.get('tags');
    if (tags) filters.tags = { $in: tags.split(',') };

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'starredAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    
    // Search in content
    const search = searchParams.get('search');
    if (search) {
      filters.$or = [
        { 'context.title': { $regex: search, $options: 'i' } },
        { 'context.description': { $regex: search, $options: 'i' } },
        { 'context.messageContent': { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const stars = await Star.find(filters)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await Star.countDocuments(filters);

    return NextResponse.json({
      stars,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching stars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stars' },
      { status: 500 }
    );
  }
}
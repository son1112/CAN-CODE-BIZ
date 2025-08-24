import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError, validateRequest } from '@/lib/error-handler';
import { ApiResponse, sanitizePagination, createPagination } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import connectDB from '@/lib/mongodb';
import Star from '@/models/Star';
import { CreateStarOptions, deriveCategory } from '@/lib/stars';
import { validators } from '@/lib/validators';

// POST /api/stars - Create a new star
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const validatedData = validateRequest(body, validators.createStar, 'stars-api');

    const validatedStarData = validatedData as { itemType: 'message' | 'session' | 'agent' | 'conversation-starter'; itemId: string; context?: Record<string, unknown>; tags?: string[]; priority?: 'low' | 'medium' | 'high' };
    const options: CreateStarOptions = {
      ...validatedStarData,
      userId // Use authenticated user ID instead of body userId
    };

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
    return handleApiError(error, 'stars-api-create');
  }
}

// GET /api/stars - Get user's stars with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    await connectDB();

    const { searchParams } = request.nextUrl;

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

    // Use standardized pagination validation
    const { page, limit, skip } = sanitizePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      50, // default limit
      100  // max limit
    );
    const offset = skip;

    // Validate and sanitize parameters
    const sortBy = ['starredAt', 'priority', 'category'].includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'starredAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const search = searchParams.get('search')?.trim().slice(0, 200);
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
    const pagination = createPagination(page, limit, total);

    logger.info('Stars retrieved successfully', {
      component: 'stars-api',
      userId,
      starCount: stars.length,
      totalCount: total,
      page,
      limit
    });

    return ApiResponse.paginated(stars, pagination, 'Stars retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'stars-api-get');
  }
}
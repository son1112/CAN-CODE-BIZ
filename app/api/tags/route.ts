import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError, validateRequest } from '@/lib/error-handler';
import { ApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { validators } from '@/lib/validators';
import connectDB from '@/lib/mongodb';
import Tag from '@/models/Tag';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    await connectDB();

    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'usageCount'; // 'usageCount', 'name', 'createdAt'
    // Validate and sanitize parameters
    const validatedLimit = parseInt(searchParams.get('limit') || '50');
    const limit = Math.min(Math.max(validatedLimit, 1), 100); // Between 1 and 100

    // Build query
    const query: Record<string, unknown> = { userId };
    
    // Validate and sanitize search parameters
    const searchTerm = search?.trim().slice(0, 100);
    const categoryTerm = category?.trim().slice(0, 50);
    
    if (categoryTerm && categoryTerm !== 'all') {
      query.category = categoryTerm;
    }
    
    if (searchTerm) {
      query.name = { $regex: searchTerm, $options: 'i' };
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

    logger.info('Tags retrieved successfully', {
      component: 'tags-api',
      userId,
      tagCount: tags.length,
      category: categoryTerm,
      search: searchTerm
    });

    return ApiResponse.success(tags, `Retrieved ${tags.length} tags`);
  } catch (error) {
    return handleApiError(error, 'tags-api-get');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const validatedData = validateRequest(body, validators.createTag, 'tags-api');
    
    const { name, color, category, description } = validatedData as { name: string; color?: string; category?: string; description?: string };

    // Check if tag already exists for this user
    const existingTag = await Tag.findOne({
      userId,
      name: name.toLowerCase().trim()
    });

    if (existingTag) {
      return ApiResponse.conflict('Tag already exists');
    }

    const tag = new Tag({
      name: name.toLowerCase().trim(),
      color: color || '#3B82F6',
      category: category?.toLowerCase().trim(),
      description: description?.trim(),
      userId,
      usageCount: 0
    });

    await tag.save();

    logger.info('Tag created successfully', {
      component: 'tags-api',
      userId,
      tagName: tag.name,
      tagId: tag._id
    });

    return ApiResponse.success(tag, 'Tag created successfully');
  } catch (error) {
    return handleApiError(error, 'tags-api-create');
  }
}
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  // SECURITY: Debug endpoints should only be accessible in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoints disabled in production' },
      { status: 404 }
    );
  }

  // Require authentication even in development
  try {
    await requireAuth(req);
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('📍 MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('📍 Database name:', process.env.MONGODB_DB || 'rubber-ducky');

    await connectDB();
    console.log('✅ MongoDB connection successful');

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      database: process.env.MONGODB_DB || 'rubber-ducky',
      hasMongoUri: !!process.env.MONGODB_URI
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      database: process.env.MONGODB_DB || 'rubber-ducky',
      hasMongoUri: !!process.env.MONGODB_URI
    }, { status: 500 });
  }
}
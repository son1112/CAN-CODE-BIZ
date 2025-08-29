import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
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
    console.log('🔍 Testing NextAuth MongoDB adapter connection...');

    // Use the same client setup as NextAuth adapter
    const client = new MongoClient(process.env.MONGODB_URI!, {
      connectTimeoutMS: 8000,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    const clientPromise = client.connect();
    const connectedClient = await clientPromise;

    // Test database operations like NextAuth would do
    const db = connectedClient.db(); // Uses default database from connection string
    const collections = await db.listCollections().toArray();

    console.log('✅ NextAuth-style MongoDB connection successful');
    console.log('📍 Available collections:', collections.map(c => c.name));

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'NextAuth MongoDB adapter test successful',
      databaseName: db.databaseName,
      collections: collections.map(c => c.name),
      connectionString: process.env.MONGODB_URI?.replace(/:([^:@]{8})[^:@]*@/, ':$1***@') // Mask password
    });

  } catch (error) {
    console.error('❌ NextAuth MongoDB adapter test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const timestamp = new Date().toISOString();
    
    // Check database connection
    await connectDB();
    
    logger.info('Health check successful', {
      component: 'health-api',
      timestamp,
      status: 'healthy'
    });

    return NextResponse.json({
      status: 'healthy',
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        api: 'operational'
      }
    }, { status: 200 });

  } catch (error) {
    logger.error('Health check failed', {
      component: 'health-api',
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
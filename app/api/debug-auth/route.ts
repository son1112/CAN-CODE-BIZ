import { NextRequest, NextResponse } from 'next/server';
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
    console.log('🔍 Testing NextAuth environment variables...');

    const requiredVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];

    const envStatus = requiredVars.map(varName => ({
      name: varName,
      exists: !!process.env[varName],
      length: process.env[varName]?.length || 0
    }));

    console.log('📍 Environment variables status:', envStatus);

    return NextResponse.json({
      success: true,
      message: 'NextAuth environment check',
      nodeEnv: process.env.NODE_ENV,
      demoMode: process.env.NEXT_PUBLIC_DEMO_MODE,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      envVars: envStatus
    });

  } catch (error) {
    console.error('❌ Auth environment check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
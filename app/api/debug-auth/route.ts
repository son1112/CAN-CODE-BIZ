import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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
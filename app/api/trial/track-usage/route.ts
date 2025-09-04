import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import UserTier from '@/models/UserTier';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { feature, engagement = 'medium', metadata = {} } = body;

    // Validate required fields
    if (!feature || typeof feature !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Feature name is required' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high'].includes(engagement)) {
      return NextResponse.json(
        { success: false, error: 'Invalid engagement level' },
        { status: 400 }
      );
    }

    await connectDB();

    const userTier = await UserTier.findOne({ userId: session.user.id });
    
    if (!userTier) {
      return NextResponse.json(
        { success: false, error: 'User tier not found' },
        { status: 404 }
      );
    }

    // Track feature usage
    userTier.trackFeatureUsage(feature, engagement);

    // Update usage counters for specific features
    switch (feature) {
      case 'claude4_access':
      case 'message_sent':
        userTier.monthlyMessageCount += 1;
        break;
      case 'pdf_export':
      case 'word_export':
        userTier.monthlyExportCount += 1;
        break;
    }

    // Add metadata if provided
    if (Object.keys(metadata).length > 0) {
      // Add metadata to the latest conversion checkpoint
      const latestCheckpoint = userTier.conversionCheckpoints[userTier.conversionCheckpoints.length - 1];
      if (latestCheckpoint) {
        latestCheckpoint.metadata = metadata;
      }
    }

    await userTier.save();

    return NextResponse.json({
      success: true,
      data: {
        tracked: true,
        feature,
        engagement,
        totalFeatureUsage: userTier.featuresUsed.length,
        conversionCheckpoints: userTier.conversionCheckpoints.length,
        monthlyMessageCount: userTier.monthlyMessageCount,
        monthlyExportCount: userTier.monthlyExportCount
      }
    });

  } catch (error) {
    console.error('Track usage API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve usage statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature');
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d

    await connectDB();

    const userTier = await UserTier.findOne({ userId: session.user.id });
    
    if (!userTier) {
      return NextResponse.json(
        { success: false, error: 'User tier not found' },
        { status: 404 }
      );
    }

    // Calculate timeframe
    const now = new Date();
    let startDate = new Date();
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Filter checkpoints by timeframe
    const recentCheckpoints = userTier.conversionCheckpoints.filter(
      checkpoint => checkpoint.timestamp >= startDate
    );

    // Filter by feature if specified
    const filteredCheckpoints = feature 
      ? recentCheckpoints.filter(checkpoint => checkpoint.feature === feature)
      : recentCheckpoints;

    // Calculate usage statistics
    const featureUsageCount = {};
    const engagementLevels = { low: 0, medium: 0, high: 0 };

    filteredCheckpoints.forEach(checkpoint => {
      // Count feature usage
      featureUsageCount[checkpoint.feature] = (featureUsageCount[checkpoint.feature] || 0) + 1;
      
      // Count engagement levels
      engagementLevels[checkpoint.engagement]++;
    });

    // Calculate engagement score
    const totalCheckpoints = filteredCheckpoints.length;
    const engagementScore = totalCheckpoints > 0 
      ? (engagementLevels.low * 1 + engagementLevels.medium * 3 + engagementLevels.high * 5) / totalCheckpoints
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        totalUsageEvents: filteredCheckpoints.length,
        uniqueFeaturesUsed: Object.keys(featureUsageCount).length,
        featureUsageCount,
        engagementLevels,
        engagementScore: Math.round(engagementScore * 100) / 100,
        monthlyCounters: {
          messages: userTier.monthlyMessageCount,
          exports: userTier.monthlyExportCount,
          lastReset: userTier.lastUsageReset
        },
        trialInfo: {
          tier: userTier.tier,
          daysRemaining: userTier.trialDaysRemaining,
          isActive: userTier.isTrialActive
        }
      }
    });

  } catch (error) {
    console.error('Usage statistics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
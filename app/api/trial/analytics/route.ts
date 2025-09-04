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
    const { 
      sessionDuration = 0, 
      messagesCount = 0, 
      featuresUsed = [], 
      engagementScore,
      conversionEvent,
      customData = {}
    } = body;

    await connectDB();

    const userTier = await UserTier.findOne({ userId: session.user.id });
    
    if (!userTier) {
      return NextResponse.json(
        { success: false, error: 'User tier not found' },
        { status: 404 }
      );
    }

    // Only record analytics for trial users
    if (userTier.tier !== 'trial') {
      return NextResponse.json({
        success: true,
        data: {
          recorded: false,
          reason: 'Not a trial user'
        }
      });
    }

    // Calculate engagement score if not provided
    let calculatedEngagementScore = engagementScore;
    if (calculatedEngagementScore === undefined) {
      // Basic engagement score calculation
      const durationScore = Math.min(sessionDuration / 300, 5); // Max 5 for 5+ minutes
      const messageScore = Math.min(messagesCount * 0.5, 5); // Max 5 for 10+ messages
      const featureScore = Math.min(featuresUsed.length, 5); // Max 5 for 5+ features
      calculatedEngagementScore = Math.round(((durationScore + messageScore + featureScore) / 3) * 100) / 100;
    }

    // Record trial analytics
    userTier.recordTrialAnalytics({
      featuresUsed,
      sessionDuration,
      messagesCount,
      engagementScore: calculatedEngagementScore
    });

    // Handle conversion event if provided
    if (conversionEvent) {
      userTier.conversionCheckpoints.push({
        feature: conversionEvent.feature,
        timestamp: new Date(),
        engagement: conversionEvent.engagement || 'medium',
        convertedToUpgrade: conversionEvent.convertedToUpgrade || false,
        promptShown: conversionEvent.promptShown || false
      });
    }

    // Add custom data to the latest analytics entry
    if (Object.keys(customData).length > 0) {
      const latestAnalytics = userTier.trialAnalytics[userTier.trialAnalytics.length - 1];
      if (latestAnalytics) {
        latestAnalytics.customData = customData;
      }
    }

    await userTier.save();

    return NextResponse.json({
      success: true,
      data: {
        recorded: true,
        analyticsId: userTier.trialAnalytics[userTier.trialAnalytics.length - 1]?._id,
        engagementScore: calculatedEngagementScore,
        trialDay: userTier.trialAnalytics[userTier.trialAnalytics.length - 1]?.day,
        totalAnalyticsEntries: userTier.trialAnalytics.length,
        conversionCheckpoints: userTier.conversionCheckpoints.length
      }
    });

  } catch (error) {
    console.error('Trial analytics API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve trial analytics
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
    const summary = searchParams.get('summary') === 'true';
    const adminView = searchParams.get('admin') === 'true';

    await connectDB();

    const userTier = await UserTier.findOne({ userId: session.user.id });
    
    if (!userTier) {
      return NextResponse.json(
        { success: false, error: 'User tier not found' },
        { status: 404 }
      );
    }

    if (summary) {
      // Return summary analytics
      const totalSessions = userTier.trialAnalytics.length;
      const totalDuration = userTier.trialAnalytics.reduce((sum: number, entry: any) => sum + entry.sessionDuration, 0);
      const totalMessages = userTier.trialAnalytics.reduce((sum: number, entry: any) => sum + entry.messagesCount, 0);
      const avgEngagement = totalSessions > 0 
        ? userTier.trialAnalytics.reduce((sum: number, entry: any) => sum + entry.engagementScore, 0) / totalSessions
        : 0;

      const uniqueFeatures = new Set();
      userTier.trialAnalytics.forEach((entry: any) => {
        entry.featuresUsed.forEach((feature: any) => uniqueFeatures.add(feature));
      });

      const conversionEvents = userTier.conversionCheckpoints.length;
      const highEngagementSessions = userTier.trialAnalytics.filter((entry: any) => entry.engagementScore >= 7).length;

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalSessions,
            totalDuration,
            totalMessages,
            averageEngagement: Math.round(avgEngagement * 100) / 100,
            uniqueFeaturesUsed: uniqueFeatures.size,
            conversionEvents,
            highEngagementSessions,
            engagementRate: totalSessions > 0 ? Math.round((highEngagementSessions / totalSessions) * 100) : 0
          },
          trialInfo: {
            tier: userTier.tier,
            trialDay: userTier.trialStartDate ? Math.floor((Date.now() - userTier.trialStartDate.getTime()) / (24 * 60 * 60 * 1000)) + 1 : 0,
            daysRemaining: userTier.trialDaysRemaining,
            isActive: userTier.isTrialActive
          }
        }
      });
    }

    // Return detailed analytics (limit to last 50 entries for performance)
    const analyticsData: any = {
      trialAnalytics: userTier.trialAnalytics.slice(-50),
      conversionCheckpoints: userTier.conversionCheckpoints.slice(-20),
      featuresUsed: userTier.featuresUsed,
      trialInfo: {
        tier: userTier.tier,
        trialStartDate: userTier.trialStartDate,
        trialEndDate: userTier.trialEndDate,
        trialExtensions: userTier.trialExtensions,
        isActive: userTier.isTrialActive,
        daysRemaining: userTier.trialDaysRemaining
      }
    };

    // Add admin-only data if requested (would need admin permission check)
    if (adminView) {
      analyticsData.adminData = {
        userId: userTier.userId,
        email: userTier.email,
        createdAt: userTier.createdAt,
        updatedAt: userTier.updatedAt,
        upgradePromptCount: userTier.upgradePromptCount,
        lastUpgradePrompt: userTier.lastUpgradePrompt,
        conversionSource: userTier.conversionSource
      };
    }

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Trial analytics retrieval API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// DELETE method to reset analytics (for development/testing)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: 'Analytics reset only available in development' },
        { status: 403 }
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

    // Reset analytics
    userTier.trialAnalytics = [];
    userTier.conversionCheckpoints = [];
    userTier.featuresUsed = [];
    userTier.upgradePromptCount = 0;
    userTier.lastUpgradePrompt = undefined;

    await userTier.save();

    return NextResponse.json({
      success: true,
      data: {
        reset: true,
        message: 'Trial analytics reset successfully'
      }
    });

  } catch (error) {
    console.error('Analytics reset API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
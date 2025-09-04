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
    const { days = 3, reason = 'user_request' } = body;

    // Validate days parameter
    if (!Number.isInteger(days) || days < 1 || days > 14) {
      return NextResponse.json(
        { success: false, error: 'Invalid days parameter. Must be 1-14.' },
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

    // Check if user can extend trial
    if (userTier.tier !== 'trial') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Only trial users can extend their trial',
          data: { currentTier: userTier.tier }
        },
        { status: 400 }
      );
    }

    if (!userTier.canExtendTrial) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Maximum trial extensions reached',
          data: { 
            extensions: userTier.trialExtensions,
            maxExtensions: userTier.maxTrialExtensions
          }
        },
        { status: 400 }
      );
    }

    // Extend the trial
    const extended = userTier.extendTrial(days);
    
    if (!extended) {
      return NextResponse.json(
        { success: false, error: 'Failed to extend trial' },
        { status: 500 }
      );
    }

    // Track the extension event
    userTier.trackFeatureUsage('trial_extended', 'medium');
    
    // Record extension analytics
    userTier.recordTrialAnalytics({
      extensionReason: reason,
      extensionDays: days,
      previousExtensions: userTier.trialExtensions - 1
    });

    await userTier.save();

    const extensionsRemaining = userTier.maxTrialExtensions - userTier.trialExtensions;

    return NextResponse.json({
      success: true,
      data: {
        extended: true,
        newExpirationDate: userTier.trialEndDate,
        daysExtended: days,
        trialDaysRemaining: userTier.trialDaysRemaining,
        extensionsUsed: userTier.trialExtensions,
        extensionsRemaining,
        canExtendAgain: extensionsRemaining > 0
      }
    });

  } catch (error) {
    console.error('Extend trial API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET method to check extension eligibility
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
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

    const canExtend = userTier.tier === 'trial' && userTier.canExtendTrial;
    const extensionsRemaining = Math.max(0, userTier.maxTrialExtensions - userTier.trialExtensions);
    
    let reason = '';
    if (userTier.tier !== 'trial') {
      reason = 'not_trial_user';
    } else if (!userTier.canExtendTrial) {
      reason = 'max_extensions_reached';
    } else if (userTier.hasTrialExpired) {
      reason = 'trial_expired';
    }

    return NextResponse.json({
      success: true,
      data: {
        canExtend,
        reason,
        extensionsUsed: userTier.trialExtensions,
        extensionsRemaining,
        maxExtensions: userTier.maxTrialExtensions,
        trialDaysRemaining: userTier.trialDaysRemaining,
        trialExpired: userTier.hasTrialExpired
      }
    });

  } catch (error) {
    console.error('Extension eligibility API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
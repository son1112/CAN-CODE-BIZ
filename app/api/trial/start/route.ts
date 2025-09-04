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
    const { email } = body;

    await connectDB();

    // Check if user already exists
    let userTier = await UserTier.findOne({ userId: session.user.id });
    
    if (userTier) {
      // User already exists - check if they can start a new trial
      if (userTier.tier === 'trial' && userTier.isTrialActive) {
        return NextResponse.json({
          success: true,
          data: {
            message: 'Trial already active',
            trialStarted: false,
            existingTrial: true,
            trialEndDate: userTier.trialEndDate
          }
        });
      }
      
      // If trial expired or user is on free tier, they can't start a new trial
      if (userTier.tier === 'free' || (userTier.tier === 'trial' && userTier.hasTrialExpired)) {
        return NextResponse.json({
          success: false,
          error: 'Trial has already been used',
          data: {
            trialStarted: false,
            reason: 'trial_already_used'
          }
        });
      }
    } else {
      // Create new trial user
      userTier = await UserTier.createTrialUser(
        session.user.id, 
        email || session.user.email
      );
    }

    await userTier.save();

    // Track trial start event
    userTier.trackFeatureUsage('trial_started', 'high');
    await userTier.save();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Trial started successfully',
        trialStarted: true,
        trialStartDate: userTier.trialStartDate,
        trialEndDate: userTier.trialEndDate,
        trialDays: userTier.trialDaysRemaining,
        tier: userTier.tier
      }
    });

  } catch (error) {
    console.error('Start trial API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET method to check if user is eligible for trial
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
    
    let eligible = true;
    let reason = '';

    if (userTier) {
      if (userTier.tier === 'trial' && userTier.isTrialActive) {
        eligible = false;
        reason = 'trial_already_active';
      } else if (userTier.tier === 'free' || (userTier.tier === 'trial' && userTier.hasTrialExpired)) {
        eligible = false;
        reason = 'trial_already_used';
      } else if (userTier.tier === 'pro' || userTier.tier === 'enterprise') {
        eligible = false;
        reason = 'already_subscribed';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        eligible,
        reason,
        hasExistingAccount: !!userTier,
        currentTier: userTier?.tier || null
      }
    });

  } catch (error) {
    console.error('Trial eligibility API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
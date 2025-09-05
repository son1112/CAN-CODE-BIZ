import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import UserTier from '@/models/UserTier';
import connectDB from '@/lib/mongodb';
import { TrialStatus } from '@/types/trial';

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

    // Find or create user tier record
    let userTier = await UserTier.findOne({ userId: session.user.id });
    
    if (!userTier) {
      // Create new trial user
      userTier = await UserTier.createTrialUser(session.user.id, session.user.email || undefined) as any;
    }

    if (!userTier) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create or find user tier'
      }, { status: 500 });
    }

    // Build trial status response
    const trialStatus: TrialStatus = {
      isTrialActive: userTier.isTrialActive,
      trialDaysRemaining: userTier.trialDaysRemaining,
      trialExpiresAt: userTier.trialEndDate || null,
      hasTrialExpired: userTier.hasTrialExpired,
      canExtendTrial: userTier.canExtendTrial,
      tier: userTier.tier,
      trialExtensions: userTier.trialExtensions,
      maxTrialExtensions: userTier.maxTrialExtensions
    };

    return NextResponse.json({
      success: true,
      data: trialStatus
    });

  } catch (error) {
    console.error('Trial status API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Update trial status (for admin use)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tier, trialEndDate, subscriptionData } = body;

    await connectDB();

    const userTier = await UserTier.findOne({ userId: session.user.id });
    if (!userTier) {
      return NextResponse.json(
        { success: false, error: 'User tier not found' },
        { status: 404 }
      );
    }

    // Update tier if provided
    if (tier) {
      if (tier === 'pro' || tier === 'enterprise') {
        userTier.upgradeToTier(tier, subscriptionData);
      } else {
        userTier.tier = tier;
      }
    }

    // Update trial end date if provided
    if (trialEndDate) {
      userTier.trialEndDate = new Date(trialEndDate);
    }

    await userTier.save();

    // Return updated status
    const trialStatus: TrialStatus = {
      isTrialActive: userTier.isTrialActive,
      trialDaysRemaining: userTier.trialDaysRemaining,
      trialExpiresAt: userTier.trialEndDate || null,
      hasTrialExpired: userTier.hasTrialExpired,
      canExtendTrial: userTier.canExtendTrial,
      tier: userTier.tier,
      trialExtensions: userTier.trialExtensions,
      maxTrialExtensions: userTier.maxTrialExtensions
    };

    return NextResponse.json({
      success: true,
      data: trialStatus
    });

  } catch (error) {
    console.error('Trial status update API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
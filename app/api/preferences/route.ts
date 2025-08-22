import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth } from '@/lib/middleware/auth';
import UserPreferences from '@/models/UserPreferences';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return authResult;
    }
    const { userId } = authResult;

    await connectDB();
    
    let preferences = await UserPreferences.findOne({ userId });
    
    // If no preferences exist, create default ones
    if (!preferences) {
      const defaultPreferences = {
        userId,
        notifications: {
          soundEffects: true,
          voiceAlerts: true,
          systemNotifications: false,
        },
        voice: {
          autoSend: true,
          silenceThreshold: 2,
          voiceQuality: 'high',
        },
        display: {
          theme: 'light',
          language: 'en',
          reducedMotion: false,
        },
        privacy: {
          saveConversations: true,
          shareUsageData: false,
          showOnlineStatus: true,
        },
      };
      
      preferences = new UserPreferences(defaultPreferences);
      await preferences.save();
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return authResult;
    }
    const { userId } = authResult;

    await connectDB();
    
    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences data is required' },
        { status: 400 }
      );
    }

    // Update or create preferences for the authenticated user
    const updatedPreferences = await UserPreferences.findOneAndUpdate(
      { userId },
      { 
        ...preferences,
        userId,
        updatedAt: new Date(),
      },
      { 
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
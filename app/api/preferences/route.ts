import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { auth } from '@/lib/auth';
import UserPreferences from '@/models/UserPreferences';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    let preferences = await UserPreferences.findOne({ userId: session.user.id });
    
    // If no preferences exist, create default ones
    if (!preferences) {
      const defaultPreferences = {
        userId: session.user.id,
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
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
      { userId: session.user.id },
      { 
        ...preferences,
        userId: session.user.id,
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
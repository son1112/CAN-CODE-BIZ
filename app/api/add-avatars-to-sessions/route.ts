import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';

// Simplified avatar selection for migration
function getRandomAvatar(): { imageUrl: string; prompt: string } {
  // Use consistent avatar for simplicity
  return {
    imageUrl: '/Gemini_Generated_Image_35trpk35trpk35tr.png',
    prompt: 'Rubber Duck Companion - Your friendly AI assistant for thinking out loud'
  };
}

export async function POST() {
  try {
    const session = await auth();
    
    // Demo mode bypass for testing
    const isDemoMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    // After migration, always use the real user ID for data consistency
    const userId = isDemoMode ? '68a33c99df2098d5e02a84e3' : session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find all sessions without avatars for this user
    const sessionsWithoutAvatars = await Session.find({
      createdBy: userId,
      $or: [
        { avatar: { $exists: false } },
        { avatar: null }
      ]
    });

    console.log(`🔄 Found ${sessionsWithoutAvatars.length} sessions without avatars for user ${userId}`);

    let updatedCount = 0;
    
    // Update each session with a random avatar
    for (const sessionDoc of sessionsWithoutAvatars) {
      const randomAvatar = getRandomAvatar();
      
      await Session.findByIdAndUpdate(sessionDoc._id, {
        avatar: {
          imageUrl: randomAvatar.imageUrl,
          prompt: randomAvatar.prompt,
          generatedAt: new Date()
        }
      });
      
      updatedCount++;
      console.log(`✅ Updated session ${sessionDoc.sessionId} with avatar: ${randomAvatar.imageUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} sessions with random avatars`,
      updatedCount,
      totalSessions: sessionsWithoutAvatars.length
    });

  } catch (error) {
    console.error('Avatar migration error:', error);
    return NextResponse.json(
      { error: 'Failed to add avatars to sessions' },
      { status: 500 }
    );
  }
}
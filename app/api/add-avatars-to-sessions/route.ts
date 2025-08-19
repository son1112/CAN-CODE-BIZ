import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';

// Random avatar selection for migration
function getRandomAvatar(): { imageUrl: string; prompt: string } {
  const avatars = [
    { 
      imageUrl: '/mock-avatars/Gemini_Generated_Image_f3qn6af3qn6af3qn.png', 
      prompt: 'Smart Tech Duck - Perfect for debugging and development conversations' 
    },
    { 
      imageUrl: '/mock-avatars/Gemini_Generated_Image_ir5hzair5hzair5h.png', 
      prompt: 'Voice Bubble Duck - Great for general conversations and rubber duck debugging' 
    },
    { 
      imageUrl: '/mock-avatars/Gemini_Generated_Image_ksuug0ksuug0ksuu (1).png', 
      prompt: 'Minimal Tech Duck - Clean design for focused problem-solving sessions' 
    },
    { 
      imageUrl: '/mock-avatars/default-duck.png', 
      prompt: 'Classic Friendly Duck - Your traditional rubber duck companion' 
    }
  ];
  
  const randomIndex = Math.floor(Math.random() * avatars.length);
  return avatars[randomIndex];
}

export async function POST() {
  try {
    const session = await auth();
    
    // Demo mode bypass for testing
    const isDemoMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const userId = isDemoMode ? 'demo-user' : session?.user?.id;
    
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
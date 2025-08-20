import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';

// Note: Replicate integration available but currently using mock mode
// const replicate = new Replicate({
//   auth: process.env.REPLICATE_API_TOKEN,
// });

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await requireAuth(request);
    
    const { userInput, sessionId } = await request.json();

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'User input is required' },
        { status: 400 }
      );
    }

    // MOCK MODE: Generate themed placeholder avatar based on user input
    const prompt = generateDuckPrompt(userInput);
    const mockAvatarUrl = generateMockAvatar(userInput);

    // Note: Using logger for structured logging instead of console.log

    // MOCK: Simulate image generation with a small delay
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time

    const imageUrl = mockAvatarUrl;

    return NextResponse.json({
      imageUrl,
      prompt: prompt,
      sessionId
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate duck avatar' },
      { status: 500 }
    );
  }
}

function generateDuckPrompt(userInput: string): string {
  const input = userInput.toLowerCase();

  // Base prompt for a rubber duck
  let prompt = "A cute rubber duck avatar, ";

  // Determine duck style based on user input themes
  if (input.includes('code') || input.includes('program') || input.includes('debug') || input.includes('function') || input.includes('variable')) {
    prompt += "wearing tiny glasses and a programmer hoodie, surrounded by floating code symbols, ";
  } else if (input.includes('design') || input.includes('art') || input.includes('creative') || input.includes('color')) {
    prompt += "wearing a beret and holding a tiny paintbrush, with paint splashes around, ";
  } else if (input.includes('data') || input.includes('analysis') || input.includes('chart') || input.includes('graph')) {
    prompt += "wearing a business tie and small reading glasses, with tiny charts floating around, ";
  } else if (input.includes('game') || input.includes('play') || input.includes('fun') || input.includes('adventure')) {
    prompt += "wearing a gaming headset and controller accessories, ";
  } else if (input.includes('music') || input.includes('song') || input.includes('audio') || input.includes('sound')) {
    prompt += "wearing headphones and musical notes floating around, ";
  } else if (input.includes('write') || input.includes('story') || input.includes('book') || input.includes('text')) {
    prompt += "wearing a tiny fedora and holding a quill pen, with floating letters, ";
  } else if (input.includes('math') || input.includes('calculate') || input.includes('number') || input.includes('formula')) {
    prompt += "wearing round spectacles with mathematical symbols floating around, ";
  } else if (input.includes('cook') || input.includes('recipe') || input.includes('food') || input.includes('kitchen')) {
    prompt += "wearing a chef's hat and tiny apron, ";
  } else if (input.includes('exercise') || input.includes('fitness') || input.includes('health') || input.includes('workout')) {
    prompt += "wearing a tiny sweatband and workout clothes, ";
  } else if (input.includes('travel') || input.includes('journey') || input.includes('adventure') || input.includes('explore')) {
    prompt += "wearing a tiny backpack and explorer hat, ";
  } else {
    // Default friendly duck
    prompt += "with a friendly expression and cheerful demeanor, ";
  }

  // Add consistent styling
  prompt += "digital art style, clean background, bright and cheerful colors, high quality, detailed, cute and professional, 3D rendered style";

  return prompt;
}

function generateMockAvatar(userInput: string): string {
  const input = userInput.toLowerCase();

  // Return themed placeholder images based on input
  // These will be replaced with your Gemini-generated duck images

  if (input.includes('code') || input.includes('program') || input.includes('debug') || input.includes('function') || input.includes('variable')) {
    return '/mock-avatars/coding-duck.png';
  } else if (input.includes('design') || input.includes('art') || input.includes('creative') || input.includes('color')) {
    return '/mock-avatars/design-duck.png';
  } else if (input.includes('data') || input.includes('analysis') || input.includes('chart') || input.includes('graph')) {
    return '/mock-avatars/data-duck.png';
  } else if (input.includes('game') || input.includes('play') || input.includes('fun') || input.includes('adventure')) {
    return '/mock-avatars/gaming-duck.png';
  } else if (input.includes('business') || input.includes('meeting') || input.includes('strategy') || input.includes('plan')) {
    return '/mock-avatars/business-duck.png';
  } else if (input.includes('learn') || input.includes('study') || input.includes('education') || input.includes('tutorial')) {
    return '/mock-avatars/student-duck.png';
  } else {
    // Default friendly duck for general conversations
    return '/mock-avatars/default-duck.png';
  }
}

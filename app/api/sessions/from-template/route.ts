import { NextRequest, NextResponse } from 'next/server';
import Session from '@/models/Session';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateSessionId, newSessionName } = await req.json();

    if (!templateSessionId || !newSessionName) {
      return NextResponse.json(
        { error: 'Template session ID and new session name are required' },
        { status: 400 }
      );
    }

    logger.info('Creating session from template', {
      component: 'SessionFromTemplateAPI',
      templateSessionId,
      newSessionName,
      userId: user.id
    });

    // Find the template session
    const templateSession = await Session.findOne({
      sessionId: templateSessionId,
      createdBy: user.id,
      isTemplate: true
    });

    if (!templateSession) {
      logger.warn('Template session not found', {
        component: 'SessionFromTemplateAPI',
        templateSessionId,
        userId: user.id
      });
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if session name already exists
    const existingSession = await Session.findOne({
      name: newSessionName,
      createdBy: user.id
    });

    if (existingSession) {
      return NextResponse.json(
        { error: 'Session name already exists' },
        { status: 409 }
      );
    }

    // Create new session from template
    const newSessionId = uuidv4();
    const newSession = new Session({
      sessionId: newSessionId,
      name: newSessionName,
      createdBy: user.id,
      messages: [], // Start with empty messages
      iterations: [],
      iterationCount: 0,
      tags: [...(templateSession.tags || [])], // Copy tags from template
      primaryAgent: templateSession.primaryAgent,
      conversationStarter: templateSession.conversationStarter,
      avatar: templateSession.avatar ? {
        imageUrl: templateSession.avatar.imageUrl,
        prompt: templateSession.avatar.prompt,
        generatedAt: new Date() // New generation date
      } : undefined,
      isActive: true,
      isArchived: false,
      isFavorite: false, // New sessions start as non-favorites
      isTemplate: false, // New session is not a template
      lastAccessedAt: new Date()
    });

    await newSession.save();

    logger.info('Session created from template successfully', {
      component: 'SessionFromTemplateAPI',
      templateSessionId,
      newSessionId,
      newSessionName
    });

    return NextResponse.json({
      success: true,
      session: {
        sessionId: newSession.sessionId,
        name: newSession.name,
        createdAt: newSession.createdAt,
        tags: newSession.tags,
        primaryAgent: newSession.primaryAgent,
        conversationStarter: newSession.conversationStarter,
        avatar: newSession.avatar
      }
    });

  } catch (error) {
    logger.error('Failed to create session from template', {
      component: 'SessionFromTemplateAPI'
    }, error);

    return NextResponse.json(
      { error: 'Failed to create session from template' },
      { status: 500 }
    );
  }
}
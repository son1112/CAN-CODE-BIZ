import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    const { sessionId, templateName, action } = await req.json();

    await connectDB();

    if (action === 'create') {
      // Create a new template from existing session
      if (!sessionId || !templateName) {
        return NextResponse.json(
          { error: 'Session ID and template name are required' },
          { status: 400 }
        );
      }

      logger.info('Creating session template', {
        component: 'TemplatesAPI',
        userId,
        sessionId,
        templateName
      });

      const originalSession = await Session.findOne({
        sessionId,
        createdBy: userId
      });

      if (!originalSession) {
        return NextResponse.json(
          { error: 'Original session not found' },
          { status: 404 }
        );
      }

      // Create template session (copy without messages, keep structure)
      const templateSession = new Session({
        sessionId: uuidv4(),
        name: `Template: ${templateName}`,
        templateName,
        isTemplate: true,
        createdBy: userId,
        primaryAgent: originalSession.primaryAgent,
        conversationStarter: originalSession.conversationStarter,
        tags: [...originalSession.tags, 'template'],
        avatar: originalSession.avatar,
        messages: [], // Empty for template
        iterations: [] // Empty for template
      });

      await templateSession.save();

      logger.info('Session template created successfully', {
        component: 'TemplatesAPI',
        userId,
        originalSessionId: sessionId,
        templateSessionId: templateSession.sessionId,
        templateName
      });

      return NextResponse.json({
        success: true,
        data: {
          sessionId: templateSession.sessionId,
          name: templateSession.name,
          templateName: templateSession.templateName,
          primaryAgent: templateSession.primaryAgent,
          conversationStarter: templateSession.conversationStarter
        }
      });

    } else if (action === 'use') {
      // Create a new session from template
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Template session ID is required' },
          { status: 400 }
        );
      }

      logger.info('Creating session from template', {
        component: 'TemplatesAPI',
        userId,
        templateSessionId: sessionId
      });

      const templateSession = await Session.findOne({
        sessionId,
        createdBy: userId,
        isTemplate: true
      });

      if (!templateSession) {
        return NextResponse.json(
          { error: 'Template session not found' },
          { status: 404 }
        );
      }

      // Create new session from template
      const newSession = new Session({
        sessionId: uuidv4(),
        name: `From ${templateSession.templateName} - ${new Date().toLocaleDateString()}`,
        createdBy: userId,
        primaryAgent: templateSession.primaryAgent,
        conversationStarter: templateSession.conversationStarter,
        tags: templateSession.tags.filter((tag: any) => tag !== 'template'),
        avatar: templateSession.avatar,
        messages: [],
        iterations: []
      });

      await newSession.save();

      logger.info('Session created from template successfully', {
        component: 'TemplatesAPI',
        userId,
        templateSessionId: sessionId,
        newSessionId: newSession.sessionId
      });

      return NextResponse.json({
        success: true,
        data: {
          sessionId: newSession.sessionId,
          name: newSession.name,
          primaryAgent: newSession.primaryAgent,
          conversationStarter: newSession.conversationStarter
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "create" or "use"' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Failed to handle session template operation', {
      component: 'TemplatesAPI'
    }, error);

    return NextResponse.json(
      { error: 'Failed to handle template operation' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);

    await connectDB();

    logger.info('Fetching session templates', {
      component: 'TemplatesAPI',
      userId
    });

    const templates = await Session.find({
      createdBy: userId,
      isTemplate: true,
      isArchived: false
    })
      .select('sessionId name templateName createdAt primaryAgent conversationStarter avatar tags')
      .sort({ createdAt: -1 });

    logger.info('Session templates fetched successfully', {
      component: 'TemplatesAPI',
      userId,
      count: templates.length
    });

    return NextResponse.json({
      success: true,
      data: templates
    });

  } catch (error) {
    logger.error('Failed to fetch session templates', {
      component: 'TemplatesAPI'
    }, error);

    return NextResponse.json(
      { error: 'Failed to fetch session templates' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await requireAuth(req);
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    logger.info('Deleting session template', {
      component: 'TemplatesAPI',
      userId,
      sessionId
    });

    const result = await Session.deleteOne({
      sessionId,
      createdBy: userId,
      isTemplate: true
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    logger.info('Session template deleted successfully', {
      component: 'TemplatesAPI',
      userId,
      sessionId
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete session template', {
      component: 'TemplatesAPI'
    }, error);

    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import Session from '@/models/Session';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(req);

    const { id: sessionId } = await params;
    const { isTemplate, templateName } = await req.json();

    logger.info('Toggling session template', {
      component: 'SessionTemplateAPI',
      sessionId,
      userId,
      isTemplate,
      templateName
    });

    const updateData: {
      isTemplate: boolean;
      updatedAt: Date;
      templateName?: string;
    } = {
      isTemplate: Boolean(isTemplate),
      updatedAt: new Date()
    };

    // If making it a template, require a template name
    if (isTemplate) {
      if (!templateName || typeof templateName !== 'string' || templateName.trim().length === 0) {
        return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
      }
      updateData.templateName = templateName.trim();
    } else {
      // If removing template status, clear template name
      updateData.templateName = undefined;
    }

    const session = await Session.findOneAndUpdate(
      {
        sessionId,
        createdBy: userId
      },
      updateData,
      { new: true }
    );

    if (!session) {
      logger.warn('Session not found for template toggle', {
        component: 'SessionTemplateAPI',
        sessionId,
        userId
      });
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    logger.info('Session template toggled successfully', {
      component: 'SessionTemplateAPI',
      sessionId,
      isTemplate: session.isTemplate,
      templateName: session.templateName
    });

    return NextResponse.json({
      success: true,
      isTemplate: session.isTemplate,
      templateName: session.templateName
    });

  } catch (error) {
    const { id: sessionId } = await params.catch(() => ({ id: 'unknown' }));

    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    logger.error('Failed to toggle session template', {
      component: 'SessionTemplateAPI',
      sessionId
    }, error);

    return NextResponse.json(
      { error: 'Failed to update template status' },
      { status: 500 }
    );
  }
}
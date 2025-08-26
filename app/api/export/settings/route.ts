import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError, ValidationRequestError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import connectDB from '@/lib/mongodb';
import UserPreferences from '@/models/UserPreferences';
import { ExportCustomizationSettings, DEFAULT_EXPORT_SETTINGS } from '@/types/export';

// GET /api/export/settings - Get user's export settings
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    await connectDB();

    const userPrefs = await UserPreferences.findOne({ userId }).lean();
    
    // Return user's export settings or defaults
    const exportSettings = userPrefs?.export || DEFAULT_EXPORT_SETTINGS;

    logger.info('Export settings retrieved', {
      component: 'export-settings-api',
      userId,
      hasCustomSettings: !!userPrefs?.export
    });

    return NextResponse.json({
      success: true,
      settings: exportSettings
    });

  } catch (error) {
    return handleApiError(error, 'export-settings-api');
  }
}

// PUT /api/export/settings - Update user's export settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      throw new ValidationRequestError('Export settings are required');
    }

    // Validate settings structure
    const requiredFields = [
      'includeBranding', 'includeMessageRole', 'includeTimestamp', 
      'fontSize', 'margin', 'defaultFormat'
    ];
    
    for (const field of requiredFields) {
      if (settings[field] === undefined) {
        throw new ValidationRequestError(`Missing required field: ${field}`);
      }
    }

    // Validate ranges
    if (settings.fontSize < 8 || settings.fontSize > 16) {
      throw new ValidationRequestError('Font size must be between 8 and 16pt');
    }
    
    if (settings.margin < 10 || settings.margin > 30) {
      throw new ValidationRequestError('Margin must be between 10 and 30mm');
    }

    if (!['pdf', 'word', 'text'].includes(settings.defaultFormat)) {
      throw new ValidationRequestError('Invalid default format');
    }

    // Update user's export settings - create if doesn't exist
    const updatedPrefs = await UserPreferences.findOneAndUpdate(
      { userId },
      { 
        export: settings,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    logger.info('Export settings updated', {
      component: 'export-settings-api',
      userId,
      preset: settings.presetId || 'custom'
    });

    return NextResponse.json({
      success: true,
      settings: updatedPrefs.export,
      message: 'Export settings updated successfully'
    });

  } catch (error) {
    return handleApiError(error, 'export-settings-api');
  }
}

// DELETE /api/export/settings - Reset to default settings
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    await connectDB();

    // Reset to default settings
    await UserPreferences.findOneAndUpdate(
      { userId },
      { 
        $unset: { export: 1 },
        updatedAt: new Date()
      },
      { upsert: true }
    );

    logger.info('Export settings reset to defaults', {
      component: 'export-settings-api',
      userId
    });

    return NextResponse.json({
      success: true,
      settings: DEFAULT_EXPORT_SETTINGS,
      message: 'Export settings reset to defaults'
    });

  } catch (error) {
    return handleApiError(error, 'export-settings-api');
  }
}
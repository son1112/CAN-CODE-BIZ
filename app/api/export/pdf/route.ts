import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { ApiResponse } from '@/lib/api-response';
import { handleApiError, ValidationRequestError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { generateMessagePDF } from '@/lib/export/pdf-generator';
import { GoogleDriveService, generateExportFileName, DOCUMENT_MIME_TYPES } from '@/lib/export/google-drive';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';

interface ExportRequest {
  messageId: string;
  sessionId: string;
  googleAccessToken: string;
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
  includeBranding?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await requireAuth(request);

    await connectDB();

    // Parse and validate request
    const body = await request.json() as ExportRequest;
    const { messageId, sessionId, googleAccessToken, includeMetadata = true, includeTimestamp = true, includeBranding = true } = body;

    if (!messageId || !sessionId || !googleAccessToken) {
      throw new ValidationRequestError('Missing required fields: messageId, sessionId, or googleAccessToken');
    }

    logger.info('PDF export requested', {
      component: 'export-pdf-api',
      userId,
      messageId,
      sessionId
    });

    // Find the session and verify ownership
    const session = await Session.findOne({
      sessionId,
      createdBy: userId
    });

    if (!session) {
      return ApiResponse.notFound('Session');
    }

    // Find the specific message
    const message = session.messages.find((msg: { _id?: { toString(): string } }) => msg._id?.toString() === messageId);
    if (!message) {
      return ApiResponse.notFound('Message');
    }

    // Prepare message data for export
    const messageData = {
      messageId: message._id?.toString() || messageId,
      content: message.content,
      role: message.role,
      timestamp: message.timestamp,
      sessionName: session.name,
      agentUsed: message.agentUsed,
      tags: message.tags
    };

    // Generate PDF
    const pdfBuffer = await generateMessagePDF(messageData, {
      includeMetadata,
      includeTimestamp,
      includeBranding
    });

    // Initialize Google Drive service
    const driveService = new GoogleDriveService(googleAccessToken);

    // Verify Google Drive permissions
    const hasPermissions = await driveService.verifyPermissions();
    if (!hasPermissions) {
      throw new ValidationRequestError('Invalid or insufficient Google Drive permissions');
    }

    // Get or create exports folder
    const folderId = await driveService.getOrCreateExportsFolder();

    // Generate filename
    const fileName = generateExportFileName(session.name, messageId, 'pdf');

    // Upload to Google Drive
    const uploadResult = await driveService.uploadFile({
      fileName,
      mimeType: DOCUMENT_MIME_TYPES.PDF,
      fileBuffer: pdfBuffer,
      folderId
    });

    logger.info('PDF export completed successfully', {
      component: 'export-pdf-api',
      userId,
      messageId,
      sessionId,
      fileName,
      fileId: uploadResult.fileId
    });

    return ApiResponse.success({
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      webViewLink: uploadResult.webViewLink,
      fileSize: pdfBuffer.length,
      exportedAt: new Date().toISOString()
    }, 'PDF exported to Google Drive successfully');

  } catch (error) {
    return handleApiError(error, 'export-pdf-api');
  }
}
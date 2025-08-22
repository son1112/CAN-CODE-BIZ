import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { ApiResponse } from '@/lib/api-response';
import { handleApiError, ValidationRequestError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { GoogleDriveService, generateExportFileName } from '@/lib/export/google-drive';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';

interface TextExportRequest {
  messageId: string;
  sessionId: string;
  googleAccessToken: string;
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await requireAuth(request);

    await connectDB();

    // Parse and validate request
    const body = await request.json() as TextExportRequest;
    const { messageId, sessionId, googleAccessToken, includeMetadata = true, includeTimestamp = true } = body;

    if (!messageId || !sessionId || !googleAccessToken) {
      throw new ValidationRequestError('Missing required fields: messageId, sessionId, or googleAccessToken');
    }

    logger.info('Text export requested', {
      component: 'export-text-api',
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

    // Generate text content
    let textContent = '';
    
    // Add header with metadata
    if (includeMetadata) {
      textContent += `RUBBER DUCKY LIVE - MESSAGE EXPORT\n`;
      textContent += `==========================================\n\n`;
      textContent += `Session: ${session.name}\n`;
      textContent += `Message ID: ${messageId}\n`;
      if (message.agentUsed) {
        textContent += `Agent: ${message.agentUsed}\n`;
      }
      if (includeTimestamp && message.timestamp) {
        const timestamp = new Date(message.timestamp).toLocaleString();
        textContent += `Timestamp: ${timestamp}\n`;
      }
      if (message.tags && message.tags.length > 0) {
        textContent += `Tags: ${message.tags.join(', ')}\n`;
      }
      textContent += `\n==========================================\n\n`;
    }

    // Add message role indicator
    const roleIndicator = message.role === 'user' ? 'USER' : 'ASSISTANT';
    textContent += `[${roleIndicator}]\n`;
    
    // Add message content
    textContent += message.content;

    // Add footer
    if (includeMetadata) {
      textContent += `\n\n==========================================\n`;
      textContent += `Exported from Rubber Ducky Live\n`;
      textContent += `Export Date: ${new Date().toLocaleString()}\n`;
      textContent += `Website: https://rubber-ducky-live.vercel.app/\n`;
    }

    // Convert text to buffer
    const textBuffer = Buffer.from(textContent, 'utf8');

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
    const fileName = generateExportFileName(session.name, messageId, 'txt');

    // Upload to Google Drive
    const uploadResult = await driveService.uploadFile({
      fileName,
      mimeType: 'text/plain',
      fileBuffer: textBuffer,
      folderId
    });

    logger.info('Text export completed successfully', {
      component: 'export-text-api',
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
      fileSize: textBuffer.length,
      exportedAt: new Date().toISOString()
    }, 'Text file exported to Google Drive successfully');

  } catch (error) {
    return handleApiError(error, 'export-text-api');
  }
}
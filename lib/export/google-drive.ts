/**
 * Google Drive API integration for document export
 */

import { google } from 'googleapis';
import { logger } from '@/lib/logger';

export interface DriveUploadOptions {
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  folderId?: string;
}

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  success: boolean;
}

/**
 * Google Drive service class for handling file uploads
 */
export class GoogleDriveService {
  private drive;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(options: DriveUploadOptions): Promise<DriveUploadResult> {
    try {
      const { fileName, mimeType, fileBuffer, folderId } = options;

      logger.info('Uploading file to Google Drive', {
        component: 'GoogleDriveService',
        fileName,
        mimeType,
        fileSize: fileBuffer.length
      });

      const fileMetadata: { name: string; parents?: string[] } = {
        name: fileName,
      };

      // If folderId is provided, place file in that folder
      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType,
        body: Buffer.from(fileBuffer)
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink'
      });

      const result: DriveUploadResult = {
        fileId: response.data.id!,
        fileName: response.data.name!,
        webViewLink: response.data.webViewLink!,
        success: true
      };

      logger.info('File uploaded successfully to Google Drive', {
        component: 'GoogleDriveService',
        fileId: result.fileId,
        fileName: result.fileName
      });

      return result;

    } catch (error) {
      logger.error('Failed to upload file to Google Drive', {
        component: 'GoogleDriveService',
        fileName: options.fileName
      }, error);

      throw new Error(`Google Drive upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create or get the Rubber Ducky Exports folder
   */
  async getOrCreateExportsFolder(): Promise<string> {
    try {
      const folderName = 'Rubber Ducky Exports';
      
      // Search for existing folder
      const searchResponse = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        const folderId = searchResponse.data.files[0].id!;
        logger.debug('Found existing exports folder', {
          component: 'GoogleDriveService',
          folderId
        });
        return folderId;
      }

      // Create new folder if it doesn't exist
      const createResponse = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });

      const folderId = createResponse.data.id!;
      logger.info('Created new exports folder', {
        component: 'GoogleDriveService',
        folderId
      });

      return folderId;

    } catch (error) {
      logger.error('Failed to create/get exports folder', {
        component: 'GoogleDriveService'
      }, error);

      throw new Error('Failed to access Google Drive folder');
    }
  }

  /**
   * Check if the user has given proper permissions
   */
  async verifyPermissions(): Promise<boolean> {
    try {
      // Try to access the user's Drive to verify permissions
      await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id)'
      });
      return true;
    } catch (error) {
      logger.warn('Google Drive permissions verification failed', {
        component: 'GoogleDriveService'
      }, error);
      return false;
    }
  }
}

/**
 * MIME types for different document formats
 */
export const DOCUMENT_MIME_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TXT: 'text/plain'
} as const;

/**
 * Generate a timestamp-based filename
 */
export function generateExportFileName(
  sessionName: string,
  messageId: string,
  format: 'pdf' | 'docx',
  timestamp: Date = new Date()
): string {
  const dateStr = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  const sanitizedSessionName = sessionName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const shortMessageId = messageId.slice(-8);
  
  return `RubberDucky_${sanitizedSessionName}_${shortMessageId}_${dateStr}_${timeStr}.${format}`;
}
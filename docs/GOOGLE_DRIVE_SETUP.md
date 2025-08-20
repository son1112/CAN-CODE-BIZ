# Google Drive Export Setup

This document explains how to set up Google Drive integration for message export functionality.

## Prerequisites

1. Google Cloud Platform (GCP) account
2. Google Drive API enabled
3. OAuth 2.0 credentials configured

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure consent screen if prompted
4. Choose "Web application" as application type
5. Add authorized origins:
   - `http://localhost:3000` (for development)
   - Your production domain (for production)
6. Add authorized redirect URIs (if needed)
7. Copy the generated Client ID

### 3. Configure Environment Variables

Add to your `.env.local` file:

```env
# Google OAuth for Drive Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

Replace `your_google_oauth_client_id_here` with your actual Google OAuth Client ID.

### 4. OAuth Scopes

The application requests the following Google Drive scope:
- `https://www.googleapis.com/auth/drive.file` - Create and manage files

## Testing

1. Start the development server: `npm run dev`
2. Navigate to a chat session with messages
3. Hover over a message to see action buttons
4. Click the "Export" button (download icon)
5. Choose "Export as PDF" or "Export as Word"
6. Complete Google OAuth flow when prompted
7. Check your Google Drive for the exported document

## Troubleshooting

### "Google API not loaded" Error
- **Cause**: The Google API script hasn't loaded or isn't accessible
- **Solutions**:
  - Refresh the page and try again
  - Check browser console for network errors
  - Verify internet connectivity
  - Ensure no ad blockers are blocking `apis.google.com`

### "Google Client ID not configured" Error
- **Cause**: Environment variable `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not set
- **Solutions**:
  - Add the environment variable to your `.env.local` file
  - Restart the development server after adding the variable
  - Verify the Client ID is correct (should start with a number and end with `.apps.googleusercontent.com`)

### "Authentication failed" or "Authentication cancelled" Error
- **Cause**: Google OAuth flow was cancelled or failed
- **Solutions**:
  - Try the export again and complete the Google sign-in process
  - Check that the Google Client ID is valid and active
  - Ensure the domain `localhost:3000` is authorized in Google Cloud Console
  - Clear browser cookies for Google and try again

### "Invalid or insufficient permissions" Error
- **Cause**: The OAuth scope doesn't include Google Drive access
- **Solutions**:
  - Check that Google Drive API is enabled in Google Cloud Console
  - Verify the OAuth scope includes `https://www.googleapis.com/auth/drive.file`
  - Re-authenticate to refresh permissions
  - Check that the Google Client ID has the correct scopes configured

### "Export failed with status 400/401/403" Error
- **Cause**: Backend API authentication or validation error
- **Solutions**:
  - Check browser console for detailed error messages
  - Verify you're signed in to the application
  - Try refreshing the page and attempting export again
  - Check server logs for specific error details

### "Google API loading timeout" Error
- **Cause**: The Google API script is taking too long to load
- **Solutions**:
  - Check internet connection stability
  - Try again with a better network connection
  - Disable browser extensions that might interfere with Google services
  - Clear browser cache and cookies

### General Troubleshooting Steps
1. **Check Browser Console**: Look for JavaScript errors or network failures
2. **Verify Environment**: Ensure all required environment variables are set
3. **Test Network**: Try accessing `https://apis.google.com/js/api.js` directly
4. **Clear Cache**: Clear browser cache and cookies for both your app and Google
5. **Try Incognito**: Test in browser incognito/private mode to rule out extensions

## File Organization

Exported files are saved to:
- **Folder**: "Rubber Ducky Live Exports" (auto-created)
- **Filename Format**: `{SessionName}_{MessageID}_{Timestamp}.{pdf|docx}`

## Security Notes

- The OAuth Client ID is public and safe to expose in frontend code
- Access tokens are handled client-side and not stored permanently
- Files are only uploaded to the user's own Google Drive
- The application only requests minimal necessary permissions

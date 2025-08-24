import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

// Helper function to extract meaningful text from parsed objects (same as migrate-sessions)
function extractTextFromParsedObject(obj: unknown): string {
  if (!obj || typeof obj !== 'object') {
    return String(obj || '');
  }

  const objectData = obj as Record<string, unknown>;

  // Handle nested success/text structure common in CLI outputs
  if (objectData.success === true && objectData.text && typeof objectData.text === 'string') {
    return objectData.text;
  }

  // Handle success/content structure
  if (objectData.success === true && objectData.content && typeof objectData.content === 'string') {
    return objectData.content;
  }

  // Check for common response fields in priority order
  const responseFields = ['response', 'content', 'text', 'message', 'output', 'result'];
  for (const field of responseFields) {
    if (objectData[field] && typeof objectData[field] === 'string') {
      return objectData[field] as string;
    }
  }

  // Handle arrays - look for text content
  if (Array.isArray(obj)) {
    const textItems = obj.filter(item => typeof item === 'string' && item.length > 0);
    if (textItems.length > 0) {
      return textItems.join('\n');
    }
  }

  // Try to extract meaningful text from any string field longer than 10 chars
  const keys = Object.keys(objectData);
  const meaningfulKeys = keys.filter(key =>
    typeof objectData[key] === 'string' &&
    (objectData[key] as string).length > 10 &&
    !['id', 'timestamp', 'type', 'status', 'success', 'metadata', 'modelName', 'modelKey', 'prompt'].includes(key)
  );

  if (meaningfulKeys.length > 0) {
    return objectData[meaningfulKeys[0]] as string;
  }

  // If we find a nested object with a promising structure, recurse
  for (const key of keys) {
    if (typeof objectData[key] === 'object' && objectData[key] !== null) {
      const nestedResult = extractTextFromParsedObject(objectData[key]);
      if (nestedResult && nestedResult.length > 10) {
        return nestedResult;
      }
    }
  }

  // Last resort: prettify JSON but try to make it readable
  try {
    const jsonStr = JSON.stringify(obj, null, 2);
    // If it's too long and looks like technical metadata, return a summary
    if (jsonStr.length > 500 && (jsonStr.includes('modelName') || jsonStr.includes('metadata'))) {
      return 'AI response data (formatted for display)';
    }
    return jsonStr;
  } catch {
    return String(obj);
  }
}

// POST /api/sessions/[id]/reimport - Re-import a specific session with enhanced parsing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find the existing session
    const existingSession = await Session.findOne({ sessionId: id });
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if this session has CLI iterations to re-process
    if (!existingSession.iterations || existingSession.iterations.length === 0) {
      return NextResponse.json(
        { error: 'No CLI iterations found to re-import' },
        { status: 400 }
      );
    }

    // Connect to the CLI database to get original data
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI not configured');
    }

    const client = new MongoClient(MONGODB_URI);

    try {
      await client.connect();

      // Access the CLI database and sessions collection
      const cliDb = client.db('rubber-ducky');
      const cliSessionsCollection = cliDb.collection('sessions');

      // Find the original CLI session by name
      const originalCliSession = await cliSessionsCollection.findOne({
        name: existingSession.name
      });

      if (!originalCliSession) {
        return NextResponse.json(
          { error: 'Original CLI session not found' },
          { status: 404 }
        );
      }

      // Re-process the messages with enhanced parsing
      const enhancedMessages = [];
      for (let i = 0; i < (originalCliSession.iterations?.length || 0); i++) {
        const iteration = originalCliSession.iterations[i];
        const primaryAgent = originalCliSession.agentNames?.[0] || 'unknown';

        // Add user message from transcript
        const transcriptStr = typeof iteration.transcript === 'string' ? iteration.transcript : String(iteration.transcript || '');
        if (transcriptStr && transcriptStr.trim()) {
          enhancedMessages.push({
            id: uuidv4(),
            role: 'user',
            content: transcriptStr.trim(),
            timestamp: iteration.timestamp,
            audioMetadata: {
              language: 'en-US'
            },
            agentUsed: primaryAgent
          });
        }

        // Add user note as additional user message if present
        const userNoteStr = typeof iteration.userNote === 'string' ? iteration.userNote : String(iteration.userNote || '');
        if (userNoteStr && userNoteStr.trim()) {
          enhancedMessages.push({
            id: uuidv4(),
            role: 'user',
            content: `[Note] ${userNoteStr.trim()}`,
            timestamp: new Date(iteration.timestamp.getTime() + 500),
            agentUsed: primaryAgent
          });
        }

        // Add assistant messages for each agent output with enhanced parsing
        for (const [agentName, output] of Object.entries(iteration.agentOutputs || {})) {
          let outputStr = '';

          if (typeof output === 'string') {
            // Handle string output - check if it's JSON
            if (output.trim().startsWith('{') && output.trim().endsWith('}')) {
              try {
                const parsed = JSON.parse(output);
                outputStr = extractTextFromParsedObject(parsed);
              } catch {
                outputStr = output;
              }
            } else {
              outputStr = output;
            }
          } else if (typeof output === 'object' && output !== null) {
            outputStr = extractTextFromParsedObject(output);
          } else {
            outputStr = String(output || '');
          }

          // Clean up the output string
          if (outputStr && outputStr.trim()) {
            // Remove excessive newlines and clean up formatting
            let cleanOutput = outputStr.trim()
              .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
              .replace(/^\s*\n+/, '') // Remove leading newlines
              .replace(/\n+\s*$/, ''); // Remove trailing newlines

            // Final cleanup for any remaining JSON artifacts
            cleanOutput = cleanOutput
              .replace(/^["']|["']$/g, '') // Remove surrounding quotes
              .replace(/\\n/g, '\n') // Convert escaped newlines
              .replace(/\\"/g, '"') // Convert escaped quotes
              .replace(/\\\\/g, '\\'); // Convert escaped backslashes

            enhancedMessages.push({
              id: uuidv4(),
              role: 'assistant',
              content: cleanOutput,
              timestamp: new Date(iteration.timestamp.getTime() + 1000),
              agentUsed: agentName,
              metadata: {
                originalFormat: typeof output,
                migratedFromCLI: true,
                reimported: true,
                reimportedAt: new Date()
              }
            });
          }
        }
      }

      // Update the session with enhanced messages
      const updatedSession = await Session.findOneAndUpdate(
        { sessionId: id },
        {
          $set: {
            messages: enhancedMessages,
            updatedAt: new Date(),
            metadata: {
              ...existingSession.metadata,
              lastReimport: new Date(),
              reimportCount: (existingSession.metadata?.reimportCount || 0) + 1
            }
          }
        },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        session: {
          sessionId: updatedSession.sessionId,
          name: updatedSession.name,
          messageCount: enhancedMessages.length,
          reimported: true
        },
        stats: {
          originalMessageCount: existingSession.messages?.length || 0,
          newMessageCount: enhancedMessages.length,
          iterationsProcessed: originalCliSession.iterations?.length || 0
        }
      });

    } finally {
      await client.close();
    }

  } catch (error) {
    console.error('Session re-import error:', error);
    return NextResponse.json(
      {
        error: 'Failed to re-import session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
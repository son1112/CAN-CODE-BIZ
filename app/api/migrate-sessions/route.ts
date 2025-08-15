import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Session from '@/models/Session';
import connectDB from '@/lib/mongodb';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

interface CLISession {
  _id: string;
  name: string;
  agentNames: string[];
  iterations: CLIIteration[];
  updatedAt: Date;
}

interface CLIIteration {
  transcript: string;
  agentOutputs: Record<string, string>;
  timestamp: Date;
  userNote?: string;
}

interface MigrationResult {
  success: boolean;
  sessionsProcessed: number;
  sessionsMigrated: number;
  sessionsSkipped: number;
  errors: string[];
  details: Array<{
    name: string;
    status: 'migrated' | 'skipped' | 'error';
    reason?: string;
    messageCount?: number;
    iterationCount?: number;
  }>;
}

// Default user ID for CLI sessions (from existing web sessions)
const DEFAULT_CLI_USER_ID = '689df4fadbf2d345b9588c3c';

// Helper function to extract meaningful text from parsed objects
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

// POST /api/migrate-sessions - Migrate CLI sessions to web UI format
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow migration for authenticated users (could add admin check here)
    await connectDB();

    const body = await request.json();
    const { dryRun = false, selectedSessions = [] } = body;

    const result: MigrationResult = {
      success: false,
      sessionsProcessed: 0,
      sessionsMigrated: 0,
      sessionsSkipped: 0,
      errors: [],
      details: []
    };

    // Connect to the CLI database (rubber-ducky)
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
      
      // Get all CLI sessions
      const cliSessions = await cliSessionsCollection.find().toArray() as unknown as CLISession[];
      
      console.log(`Found ${cliSessions.length} CLI sessions to process`);
      result.sessionsProcessed = cliSessions.length;

      for (const cliSession of cliSessions) {
        try {
          // Skip if this session is not selected for migration
          if (selectedSessions.length > 0 && !selectedSessions.includes(cliSession.name)) {
            continue;
          }
          
          // Check if this session already exists in the web UI
          const existingSession = await Session.findOne({ 
            name: cliSession.name,
            createdBy: DEFAULT_CLI_USER_ID 
          });

          if (existingSession) {
            result.sessionsSkipped++;
            result.details.push({
              name: cliSession.name,
              status: 'skipped',
              reason: 'Already exists in web UI'
            });
            continue;
          }

          // Transform CLI session to web UI format
          const sessionId = uuidv4();
          const firstIteration = cliSession.iterations?.[0];
          const createdAt = firstIteration?.timestamp || cliSession.updatedAt || new Date();

          // Convert iterations to chat messages
          const messages = [];
          for (let i = 0; i < (cliSession.iterations?.length || 0); i++) {
            const iteration = cliSession.iterations[i];
            const primaryAgent = cliSession.agentNames?.[0] || 'unknown';

            // Add user message from transcript
            const transcriptStr = typeof iteration.transcript === 'string' ? iteration.transcript : String(iteration.transcript || '');
            if (transcriptStr && transcriptStr.trim()) {
              messages.push({
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
              messages.push({
                id: uuidv4(),
                role: 'user',
                content: `[Note] ${userNoteStr.trim()}`,
                timestamp: new Date(iteration.timestamp.getTime() + 500), // +0.5 seconds
                agentUsed: primaryAgent
              });
            }

            // Add assistant messages for each agent output
            for (const [agentName, output] of Object.entries(iteration.agentOutputs || {})) {
              // Enhanced output parsing for better display
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
                
                messages.push({
                  id: uuidv4(),
                  role: 'assistant',
                  content: cleanOutput,
                  timestamp: new Date(iteration.timestamp.getTime() + 1000), // +1 second
                  agentUsed: agentName,
                  metadata: {
                    originalFormat: typeof output,
                    migratedFromCLI: true
                  }
                });
              }
            }
          }

          // Improve session naming for better UI display
          let displayName = cliSession.name;
          
          // Clean up technical session names
          if (displayName && typeof displayName === 'string') {
            // Remove UUID-like patterns
            displayName = displayName.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '');
            
            // Remove excessive timestamps
            displayName = displayName.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z?/g, '');
            
            // Clean up underscores and dashes
            displayName = displayName.replace(/[_-]+/g, ' ').trim();
            
            // Capitalize first letter
            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            
            // If it's still empty or too short, generate a better name
            if (!displayName || displayName.length < 3) {
              const firstMessage = firstIteration?.transcript || '';
              if (firstMessage && firstMessage.length > 10) {
                // Use first part of the conversation as name
                displayName = firstMessage.slice(0, 50).trim();
                if (displayName.length === 50) {
                  displayName += '...';
                }
              } else {
                // Use agent name + date
                const agentName = cliSession.agentNames?.[0] || 'AI';
                const date = new Date(createdAt).toLocaleDateString();
                displayName = `${agentName} Chat - ${date}`;
              }
            }
          } else {
            // Fallback naming
            const agentName = cliSession.agentNames?.[0] || 'AI';
            const date = new Date(createdAt).toLocaleDateString();
            displayName = `${agentName} Chat - ${date}`;
          }

          // Create the unified session document
          const sessionData = {
            sessionId,
            name: displayName,
            createdBy: DEFAULT_CLI_USER_ID,
            createdAt,
            updatedAt: cliSession.updatedAt || createdAt,
            lastAccessedAt: cliSession.updatedAt || createdAt,
            
            // Interactive chat data (converted from iterations)
            messages,
            
            // CLI-style iterations (preserved for compatibility)
            iterations: (cliSession.iterations || []).map((iteration, index) => ({
              iteration: index + 1,
              processedAt: iteration.timestamp,
              agent: cliSession.agentNames?.[0] || 'unknown',
              transcript: iteration.transcript || '',
              agentOutputs: iteration.agentOutputs || {},
              userNote: iteration.userNote || '',
              metadata: {
                migrated: true,
                originalCliSession: true
              }
            })),
            iterationCount: cliSession.iterations?.length || 0,
            
            // Metadata
            tags: [...new Set([
              ...(cliSession.agentNames || []),
              'cli-migrated',
              'rubber-ducky-node'
            ])],
            isActive: true,
            isArchived: false,
            lastAgentUsed: cliSession.agentNames?.[0],
            conversationStarter: firstIteration?.transcript?.slice(0, 100)
          };

          if (!dryRun) {
            // Save to unified sessions collection
            const newSession = new Session(sessionData);
            await newSession.save();
          }

          result.sessionsMigrated++;
          result.details.push({
            name: cliSession.name,
            status: 'migrated',
            messageCount: messages.length,
            iterationCount: cliSession.iterations?.length || 0
          });

          console.log(`${dryRun ? '[DRY RUN] ' : ''}Migrated session: ${cliSession.name} (${messages.length} messages, ${cliSession.iterations?.length || 0} iterations)`);

        } catch (sessionError) {
          console.error(`Error processing session ${cliSession.name}:`, sessionError);
          console.error('Session data:', JSON.stringify(cliSession, null, 2));
          const errorMessage = sessionError instanceof Error ? sessionError.message : 'Unknown error';
          result.errors.push(`${cliSession.name}: ${errorMessage}`);
          result.details.push({
            name: cliSession.name,
            status: 'error',
            reason: errorMessage
          });
        }
      }

      result.success = true;

    } finally {
      await client.close();
    }

    return NextResponse.json({
      success: result.success,
      dryRun,
      summary: {
        sessionsProcessed: result.sessionsProcessed,
        sessionsMigrated: result.sessionsMigrated,
        sessionsSkipped: result.sessionsSkipped,
        errorCount: result.errors.length
      },
      details: result.details,
      errors: result.errors.length > 0 ? result.errors : undefined
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/migrate-sessions - Get migration status and preview
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Connect to CLI database to get session count
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI not configured');
    }

    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      
      const cliDb = client.db('rubber-ducky');
      const cliSessionsCollection = cliDb.collection('sessions');
      
      const totalCliSessions = await cliSessionsCollection.countDocuments();
      const cliSessions = await cliSessionsCollection
        .find({}, { projection: { name: 1, agentNames: 1, updatedAt: 1, iterations: 1 } })
        .sort({ updatedAt: -1 })
        .toArray();

      // Check existing web UI sessions for this user
      const existingWebSessions = await Session.find({
        createdBy: DEFAULT_CLI_USER_ID
      }).select('name').lean();

      const existingNames = new Set(existingWebSessions.map(s => s.name));
      
      const preview = cliSessions.map(session => ({
        name: session.name,
        agentNames: session.agentNames || [],
        updatedAt: session.updatedAt,
        iterationCount: session.iterations?.length || 0,
        alreadyMigrated: existingNames.has(session.name)
      }));

      const migratable = preview.filter(s => !s.alreadyMigrated).length;
      const alreadyMigrated = preview.filter(s => s.alreadyMigrated).length;

      return NextResponse.json({
        success: true,
        totalCliSessions,
        migratable,
        alreadyMigrated,
        preview: preview.slice(0, 20), // Show first 20 sessions
        defaultUserId: DEFAULT_CLI_USER_ID
      });

    } finally {
      await client.close();
    }

  } catch (error) {
    console.error('Migration preview error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
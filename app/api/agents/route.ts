import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { spawn } from 'child_process';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
// Temporarily disable direct imports due to package export issues
// Will use CLI approach until package exports are fixed
// import { getAllAgents, createAgent as createAgentInPackage } from '@son1112/rubber-ducky-node';

// Helper function to execute CLI commands
async function executeCliCommand(command: string, args: string[] = []): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['@son1112/rubber-ducky-node', command, ...args], {
      stdio: 'pipe',
      env: {
        ...process.env,
        // Ensure the CLI can access the same environment variables
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`CLI command failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// GET /api/agents - List all available agents
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use CLI to get agents from MongoDB (temporary until package exports are fixed)
    try {
      const { stdout } = await executeCliCommand('list-agents');
      
      // Parse the CLI output to extract agent information
      const agents = parseAgentListOutput(stdout);

      return NextResponse.json({
        agents: agents,
        count: agents.length
      });
    } catch (cliError) {
      console.error('CLI agent listing error:', cliError);
      // If CLI fails, this indicates MongoDB or package issues
      throw new Error('Failed to connect to agent storage');
    }
  } catch (error: unknown) {
    console.error('List agents error:', error);
    
    // Provide specific error messages based on error type
    let errorMessage = 'Failed to fetch agents';
    if ((error instanceof Error && error.message?.includes('MongoDB')) || (error instanceof Error && error.message?.includes('connection'))) {
      errorMessage = 'Database connection error. Please check MongoDB connection.';
    } else if (error instanceof Error && error.message?.includes('timeout')) {
      errorMessage = 'Database request timed out. Please try again.';
    } else if (error instanceof Error && error.message?.includes('authentication')) {
      errorMessage = 'Database authentication failed.';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent or process text with an agent
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, agentName, transcript, agentDefinition, voiceDescription } = body;

    switch (action) {
      case 'process':
        return await processWithAgent(agentName, transcript);
      
      case 'create':
        return await createAgent(voiceDescription || agentDefinition);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: process, create' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Agents API error:', error);
    return NextResponse.json(
      { error: 'Agent operation failed' },
      { status: 500 }
    );
  }
}

// Process text with a specific agent
async function processWithAgent(agentName: string, transcript: string) {
  try {
    // Create a temporary transcript file
    const fs = await import('fs').then(m => m.promises);
    const os = await import('os');
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `transcript-${Date.now()}.txt`);
    
    await fs.writeFile(tempFile, transcript, 'utf-8');

    try {
      // Use the CLI's generate command to process the transcript
      const args = [agentName, tempFile];
      const { stdout } = await executeCliCommand('generate', args);

      // Clean up temp file
      await fs.unlink(tempFile);

      return NextResponse.json({
        success: true,
        result: stdout.trim(),
        agent: agentName
      });
    } catch (processError) {
      // Clean up temp file even if processing fails
      try {
        await fs.unlink(tempFile);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
      throw processError;
    }
  } catch (error) {
    console.error('Process with agent error:', error);
    return NextResponse.json(
      { error: `Failed to process with agent ${agentName}` },
      { status: 500 }
    );
  }
}

// Create a new agent from voice description
async function createAgent(voiceDescription: string) {
  try {
    if (!voiceDescription || typeof voiceDescription !== 'string') {
      return NextResponse.json(
        { error: 'Voice description is required' },
        { status: 400 }
      );
    }

    // Get session for user ID
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Claude AI client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Use Claude to analyze the voice description and create agent structure
    const agentCreationPrompt = `You are an AI agent creation assistant. Based on the user's voice description, create a new AI agent with the following JSON structure:

{
  "name": "agent-name-in-kebab-case",
  "description": "A clear, comprehensive description of what this agent does and its purpose",
  "prompt": "A detailed prompt template that includes {{transcript}} placeholder where the user's input will be inserted"
}

Guidelines:
1. Create a unique, descriptive name in kebab-case (lowercase with hyphens)
2. Write a thorough description explaining the agent's purpose and capabilities
3. Craft a detailed prompt that will guide the AI to perform the requested task effectively
4. Always include {{transcript}} in the prompt where user input should be processed
5. Make the prompt specific and actionable based on the user's description

User's voice description of the agent they want:
"${voiceDescription}"

Respond with ONLY the JSON object, no additional text or explanation.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: agentCreationPrompt
        }
      ]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Parse the Claude response to get the agent structure
    let newAgent;
    try {
      newAgent = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError, responseText);
      return NextResponse.json(
        { error: 'Failed to generate valid agent structure' },
        { status: 500 }
      );
    }

    // Validate the agent structure
    if (!newAgent.name || !newAgent.description || !newAgent.prompt) {
      return NextResponse.json(
        { error: 'Generated agent is missing required fields' },
        { status: 500 }
      );
    }

    // Create agent directly in MongoDB (since CLI add-agent is interactive only)
    try {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI!);
      
      try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || 'rubber-ducky');
        const collection = db.collection('agents');
        
        // Check if agent with this name already exists
        const existingAgent = await collection.findOne({ name: newAgent.name });
        if (existingAgent) {
          return NextResponse.json(
            { error: `Agent with name "${newAgent.name}" already exists` },
            { status: 409 }
          );
        }
        
        // Add metadata for web-created agents
        const agentDocument = {
          ...newAgent,
          createdAt: new Date(),
          createdBy: session.user.id,
          source: 'web',
          isActive: true
        };
        
        const insertResult = await collection.insertOne(agentDocument);
        
        return NextResponse.json({
          success: true,
          agent: newAgent,
          insertedId: insertResult.insertedId,
          message: `Agent "${newAgent.name}" created successfully`
        });
      } finally {
        await client.close();
      }
    } catch (error: unknown) {
      console.error('Agent creation error:', error);
      
      // Handle specific MongoDB error cases
      if (error instanceof Error && 'code' in error && error.code === 11000) { // Duplicate key error
        return NextResponse.json(
          { error: `Agent with name "${newAgent.name}" already exists` },
          { status: 409 }
        );
      }
      throw error;
    }

  } catch (error: unknown) {
    console.error('Create agent error:', error);
    
    // Provide specific error messages based on error type
    let errorMessage = 'Failed to create agent';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message?.includes('MongoDB') || error.message?.includes('connection')) {
        errorMessage = 'Database connection error. Unable to create agent.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Database request timed out. Please try again.';
      } else if (error.message?.includes('authentication')) {
        errorMessage = 'Database authentication failed.';
      } else if (error.message?.includes('validation')) {
        errorMessage = 'Agent validation failed. Please check the agent data.';
        statusCode = 400;
      } else if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        errorMessage = 'An agent with this name already exists.';
        statusCode = 409;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// Parse the CLI list-agents output into structured data
function parseAgentListOutput(output: string): Array<{
  name: string;
  description: string;
  prompt: string;
}> {
  try {
    const lines = output.split('\n');
    const agents: Array<{ name: string; description: string; prompt: string }> = [];
    let currentAgent: { name?: string; description?: string; prompt?: string } = {};
    let collectingDescription = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and system messages
      if (!trimmed || 
          trimmed.includes('──────') || 
          trimmed.includes('Available Agents') ||
          trimmed.includes('MongoDB connection') ||
          trimmed.includes('Pool config') ||
          trimmed.includes('Agent collection') ||
          trimmed.includes('Closing MongoDB') ||
          trimmed.startsWith('✅') ||
          trimmed.startsWith('📊') ||
          trimmed.startsWith('🔄') ||
          trimmed.startsWith('🔴')) {
        continue;
      }
      
      // Check for "No agents found" message
      if (trimmed.includes('No agents found')) {
        return []; // Return empty array if no agents
      }
      
      // End parsing when we hit the total line
      if (trimmed.startsWith('✨ Total:')) {
        break;
      }
      
      // Look for agent entries starting with 📌
      if (trimmed.startsWith('📌 ')) {
        // Save previous agent if exists
        if (currentAgent.name && currentAgent.description) {
          agents.push({
            name: currentAgent.name,
            description: currentAgent.description.trim(),
            prompt: currentAgent.description.trim() // Using description as prompt since CLI doesn't expose prompt separately
          });
        }
        
        // Start new agent - extract name after the 📌 emoji
        const agentName = trimmed.substring(2).trim(); // Remove "📌 " prefix
        currentAgent = { 
          name: agentName,
          description: '',
          prompt: ''
        };
        collectingDescription = true;
      } else if (collectingDescription && currentAgent.name && trimmed) {
        // This is a description line (indented content after agent name)
        if (currentAgent.description) {
          currentAgent.description += '\n' + trimmed;
        } else {
          currentAgent.description = trimmed;
        }
      }
    }
    
    // Add the last agent if exists
    if (currentAgent.name && currentAgent.description) {
      agents.push({
        name: currentAgent.name,
        description: currentAgent.description.trim(),
        prompt: currentAgent.description.trim() // Using description as prompt since CLI doesn't expose prompt separately
      });
    }
    
    return agents;
  } catch (error) {
    console.error('Error parsing agent list output:', error);
    return [];
  }
}
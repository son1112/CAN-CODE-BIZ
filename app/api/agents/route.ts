import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

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

    // Read agents directly from the CLI package's agents.json file
    const agentsFilePath = path.join(process.cwd(), 'node_modules', '@son1112', 'rubber-ducky-node', 'agents.json');
    
    if (!fs.existsSync(agentsFilePath)) {
      return NextResponse.json({
        agents: [],
        count: 0,
        message: 'No agents configuration found'
      });
    }

    const agentsData = fs.readFileSync(agentsFilePath, 'utf-8');
    const agents = JSON.parse(agentsData);

    // Transform agents data for the web app
    const transformedAgents = agents.map((agent: { name: string; description: string; prompt: string }) => ({
      name: agent.name,
      description: agent.description,
      prompt: agent.prompt
    }));

    return NextResponse.json({
      agents: transformedAgents,
      count: transformedAgents.length
    });
  } catch (error) {
    console.error('List agents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
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
    const { action, agentName, transcript, agentDefinition } = body;

    switch (action) {
      case 'process':
        return await processWithAgent(agentName, transcript);
      
      case 'create':
        return await createAgent(agentDefinition);
      
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

// Create a new agent (this would be complex as the CLI uses interactive input)
async function createAgent(_agentDefinition: Record<string, unknown>) {
  // For now, return a placeholder response
  // The CLI's add-agent command is fully interactive, so we'd need to 
  // either modify the CLI or implement agent creation directly
  return NextResponse.json(
    { error: 'Agent creation via API not yet implemented' },
    { status: 501 }
  );
}

// Parse the CLI list-agents output into structured data (currently unused)
// function parseAgentListOutput(output: string): Array<{
//   name: string;
//   description: string;
// }> {
//   try {
//     const lines = output.split('\n');
//     const agents: Array<{ name: string; description: string }> = [];
//     let currentAgent: { name?: string; description?: string } = {};
//     
//     for (const line of lines) {
//       const trimmed = line.trim();
//       if (!trimmed || trimmed.includes('──────') || trimmed.includes('Available Agents')) {
//         continue;
//       }
//       if (trimmed.startsWith('✨ Total:')) {
//         break;
//       }
//       if (trimmed && !trimmed.startsWith(' ')) {
//         if (currentAgent.name) {
//           agents.push({
//             name: currentAgent.name,
//             description: currentAgent.description || 'No description available'
//           });
//         }
//         currentAgent = { name: trimmed };
//       } else if (trimmed.startsWith(' ') && currentAgent.name) {
//         currentAgent.description = (currentAgent.description || '') + ' ' + trimmed;
//       }
//     }
//     if (currentAgent.name) {
//       agents.push({
//         name: currentAgent.name,
//         description: currentAgent.description || 'No description available'
//       });
//     }
//     return agents;
//   } catch (error) {
//     console.error('Error parsing agent list output:', error);
//     return [];
//   }
// }
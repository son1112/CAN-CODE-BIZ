import Anthropic from '@anthropic-ai/sdk';
import { ClaudeModel, DEFAULT_MODEL, getModelConfig } from './models';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function* streamClaudeResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string,
  model: ClaudeModel = DEFAULT_MODEL
) {
  try {
    const modelConfig = getModelConfig(model);
    const stream = await anthropic.messages.create({
      model: model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      system: systemPrompt || 'You are a helpful AI assistant.',
      max_tokens: modelConfig.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield { content: chunk.delta.text, isComplete: false };
      }
    }
    
    yield { content: '', isComplete: true };
  } catch (error) {
    console.error('Claude API error:', error);
    yield { 
      content: '', 
      isComplete: true, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function getClaudeResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string,
  model: ClaudeModel = DEFAULT_MODEL
): Promise<string> {
  try {
    const modelConfig = getModelConfig(model);
    const response = await anthropic.messages.create({
      model: model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      system: systemPrompt || 'You are a helpful AI assistant.',
      max_tokens: modelConfig.maxTokens,
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}
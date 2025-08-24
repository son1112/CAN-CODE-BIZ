import Anthropic from '@anthropic-ai/sdk';
import { ClaudeModel, DEFAULT_MODEL, getModelConfig } from './models';
import { logger } from './logger';
import {
  ModelFallbackConfig,
  FallbackResult,
  DEFAULT_FALLBACK_CONFIG,
  isOverloadError,
  isTimeoutError,
  getNextFallbackModel,
  withTimeout,
  logModelFallback,
  getFallbackExplanation
} from './claude-fallback';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function* streamClaudeResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string,
  model: ClaudeModel = DEFAULT_MODEL,
  fallbackConfig: ModelFallbackConfig = DEFAULT_FALLBACK_CONFIG
) {
  const originalModel = model;
  let currentModel = model;
  let attempt = 1;
  let fallbackResult: FallbackResult | null = null;

  while (attempt <= fallbackConfig.maxRetries) {
    try {
      const modelConfig = getModelConfig(currentModel);

      // Create stream with timeout wrapper
      const streamPromise = anthropic.messages.create({
        model: currentModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        system: systemPrompt || 'You are a helpful AI assistant.',
        max_tokens: modelConfig.maxTokens,
        stream: true,
      });

      const stream = await withTimeout(
        streamPromise,
        fallbackConfig.timeout,
        `Request timed out after ${fallbackConfig.timeout}ms`
      );

      // If we used a fallback model, notify about it
      if (fallbackResult) {
        yield {
          content: '',
          isComplete: false,
          fallback: fallbackResult,
          fallbackMessage: getFallbackExplanation(fallbackResult)
        };
      }

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield { content: chunk.delta.text, isComplete: false };
        }
      }

      yield { content: '', isComplete: true };
      return; // Success - exit retry loop

    } catch (error) {
      logger.error('Claude API streaming error', {
        component: 'claude',
        model: currentModel,
        attempt,
        originalModel
      }, error);

      // Determine if we should try fallback
      const shouldFallback = (
        isOverloadError(error) ||
        isTimeoutError(error)
      ) && attempt < fallbackConfig.maxRetries;

      if (shouldFallback) {
        const nextModel = getNextFallbackModel(currentModel, fallbackConfig);

        if (nextModel) {
          const fallbackReason = isOverloadError(error) ? 'overloaded' :
                                 isTimeoutError(error) ? 'timeout' : 'error';

          fallbackResult = {
            model: nextModel,
            attempt: attempt + 1,
            fallbackReason,
            originalModel
          };

          logModelFallback(fallbackResult);
          currentModel = nextModel;
          attempt++;
          continue; // Try again with fallback model
        }
      }

      // No fallback available or non-recoverable error
      yield {
        content: '',
        isComplete: true,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallback: fallbackResult
      };
      return;
    }
  }
}

export async function getClaudeResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string,
  model: ClaudeModel = DEFAULT_MODEL,
  fallbackConfig: ModelFallbackConfig = DEFAULT_FALLBACK_CONFIG
): Promise<{ text: string; fallback?: FallbackResult }> {
  const originalModel = model;
  let currentModel = model;
  let attempt = 1;
  let fallbackResult: FallbackResult | null = null;

  while (attempt <= fallbackConfig.maxRetries) {
    try {
      const modelConfig = getModelConfig(currentModel);

      const responsePromise = anthropic.messages.create({
        model: currentModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        system: systemPrompt || 'You are a helpful AI assistant.',
        max_tokens: modelConfig.maxTokens,
      });

      const response = await withTimeout(
        responsePromise,
        fallbackConfig.timeout,
        `Request timed out after ${fallbackConfig.timeout}ms`
      );

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      return {
        text,
        fallback: fallbackResult || undefined
      };

    } catch (error) {
      logger.error('Claude API error', {
        component: 'claude',
        model: currentModel,
        attempt,
        originalModel
      }, error);

      // Determine if we should try fallback
      const shouldFallback = (
        isOverloadError(error) ||
        isTimeoutError(error)
      ) && attempt < fallbackConfig.maxRetries;

      if (shouldFallback) {
        const nextModel = getNextFallbackModel(currentModel, fallbackConfig);

        if (nextModel) {
          const fallbackReason = isOverloadError(error) ? 'overloaded' :
                                 isTimeoutError(error) ? 'timeout' : 'error';

          fallbackResult = {
            model: nextModel,
            attempt: attempt + 1,
            fallbackReason,
            originalModel
          };

          logModelFallback(fallbackResult);
          currentModel = nextModel;
          attempt++;
          continue; // Try again with fallback model
        }
      }

      // No fallback available or non-recoverable error
      throw error;
    }
  }

  // This should never be reached due to the retry logic, but TypeScript needs it
  throw new Error('Max retries exceeded');
}
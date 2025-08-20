/**
 * Common validation utilities for API requests and data processing
 */

import { FieldValidationError } from './error-handler';

// Type definitions for validation
interface CreateSessionRequest {
  name?: string;
  tags?: string[];
  conversationStarter?: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  model?: string;
}

interface UserPreferencesRequest {
  notifications?: {
    soundEffects?: boolean;
    voiceAlerts?: boolean;
    systemNotifications?: boolean;
  };
  voice?: {
    autoSend?: boolean;
    silenceThreshold?: number;
    voiceQuality?: string;
  };
  display?: {
    theme?: string;
    language?: string;
    reducedMotion?: boolean;
  };
  privacy?: {
    saveConversations?: boolean;
    shareUsageData?: boolean;
    showOnlineStatus?: boolean;
  };
}

interface CreateStarRequest {
  itemType: string;
  itemId: string;
  context?: Record<string, unknown>;
  tags?: string[];
  priority?: string;
}

interface CreateTagRequest {
  name: string;
  color?: string;
  category?: string;
  description?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FieldValidationError[];
}

export class Validator {
  private errors: FieldValidationError[] = [];

  /**
   * Add an error to the validation result
   */
  public addError(field: string, message: string): void {
    this.errors.push({ field, message });
  }

  /**
   * Validate a required string field
   */
  required(value: unknown, field: string, maxLength?: number): this {
    if (value === undefined || value === null || value === '') {
      this.addError(field, 'is required');
      return this;
    }

    if (typeof value !== 'string') {
      this.addError(field, 'must be a string');
      return this;
    }

    if (value.trim().length === 0) {
      this.addError(field, 'cannot be empty');
      return this;
    }

    if (maxLength && value.length > maxLength) {
      this.addError(field, `must be less than ${maxLength} characters`);
    }

    return this;
  }

  /**
   * Validate an optional string field
   */
  optionalString(value: unknown, field: string, maxLength?: number): this {
    if (value === undefined || value === null || value === '') {
      return this; // Optional field is valid when empty
    }

    if (typeof value !== 'string') {
      this.addError(field, 'must be a string');
      return this;
    }

    if (maxLength && value.length > maxLength) {
      this.addError(field, `must be less than ${maxLength} characters`);
    }

    return this;
  }

  /**
   * Validate an array field
   */
  array(value: unknown, field: string, maxItems?: number): this {
    if (!Array.isArray(value)) {
      this.addError(field, 'must be an array');
      return this;
    }

    if (maxItems && value.length > maxItems) {
      this.addError(field, `must have at most ${maxItems} items`);
    }

    return this;
  }

  /**
   * Validate an array of strings
   */
  stringArray(value: unknown, field: string, maxItems?: number, maxItemLength?: number): this {
    this.array(value, field, maxItems);

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item !== 'string') {
          this.addError(`${field}[${index}]`, 'must be a string');
        } else if (item.trim().length === 0) {
          this.addError(`${field}[${index}]`, 'cannot be empty');
        } else if (maxItemLength && item.length > maxItemLength) {
          this.addError(`${field}[${index}]`, `must be less than ${maxItemLength} characters`);
        }
      });
    }

    return this;
  }

  /**
   * Validate a number field
   */
  number(value: unknown, field: string, min?: number, max?: number): this {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(field, 'must be a valid number');
      return this;
    }

    if (min !== undefined && value < min) {
      this.addError(field, `must be at least ${min}`);
    }

    if (max !== undefined && value > max) {
      this.addError(field, `must be at most ${max}`);
    }

    return this;
  }

  /**
   * Validate an integer field
   */
  integer(value: unknown, field: string, min?: number, max?: number): this {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      this.addError(field, 'must be an integer');
      return this;
    }

    return this.number(value, field, min, max);
  }

  /**
   * Validate a boolean field
   */
  boolean(value: unknown, field: string): this {
    if (typeof value !== 'boolean') {
      this.addError(field, 'must be a boolean');
    }

    return this;
  }

  /**
   * Validate an email field
   */
  email(value: unknown, field: string): this {
    if (typeof value !== 'string') {
      this.addError(field, 'must be a string');
      return this;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      this.addError(field, 'must be a valid email address');
    }

    return this;
  }

  /**
   * Validate that a value is one of the allowed values
   */
  oneOf<T>(value: unknown, field: string, allowedValues: T[]): this {
    if (!allowedValues.includes(value as T)) {
      this.addError(field, `must be one of: ${allowedValues.join(', ')}`);
    }

    return this;
  }

  /**
   * Add custom validation
   */
  custom(condition: boolean, field: string, message: string): this {
    if (!condition) {
      this.addError(field, message);
    }

    return this;
  }

  /**
   * Get validation result
   */
  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    };
  }

  /**
   * Reset validator for reuse
   */
  reset(): this {
    this.errors = [];
    return this;
  }
}

/**
 * Create a new validator instance
 */
export function createValidator(): Validator {
  return new Validator();
}

/**
 * Common validation schemas for API requests
 */
export const validators = {
  /**
   * Validate session creation request
   */
  createSession: (data: unknown) => {
    const validator = createValidator();
    
    if (typeof data !== 'object' || data === null) {
      validator.addError('body', 'must be an object');
      return validator.getResult();
    }

    const { name, tags, conversationStarter } = data as CreateSessionRequest;

    return validator
      .optionalString(name, 'name', 200)
      .stringArray(tags || [], 'tags', 10, 50)
      .optionalString(conversationStarter, 'conversationStarter', 1000)
      .getResult();
  },

  /**
   * Validate chat message request
   */
  chatRequest: (data: unknown) => {
    const validator = createValidator();

    if (typeof data !== 'object' || data === null) {
      validator.addError('body', 'must be an object');
      return validator.getResult();
    }

    const { messages, systemPrompt, model } = data as ChatRequest;

    validator.array(messages, 'messages');

    if (Array.isArray(messages)) {
      if (messages.length === 0) {
        validator.addError('messages', 'cannot be empty');
      }

      messages.forEach((msg, index) => {
        if (typeof msg !== 'object' || msg === null) {
          validator.addError(`messages[${index}]`, 'must be an object');
          return;
        }

        validator
          .required(msg.role, `messages[${index}].role`)
          .oneOf(msg.role, `messages[${index}].role`, ['user', 'assistant', 'system'])
          .required(msg.content, `messages[${index}].content`, 50000); // Increased to handle longer AI responses
      });

      // Check total content length (increased limit for chat conversations)
      const totalLength = messages.reduce((total, msg) => 
        total + (typeof msg.content === 'string' ? msg.content.length : 0), 0
      );
      
      if (totalLength > 500000) { // 500KB for longer conversations
        validator.addError('messages', 'total content length exceeds maximum (500KB)');
      }
    }

    return validator
      .optionalString(systemPrompt, 'systemPrompt', 50000) // Increased for agent system prompts
      .optionalString(model, 'model', 100)
      .getResult();
  },

  /**
   * Validate user preferences
   */
  userPreferences: (data: unknown) => {
    const validator = createValidator();

    if (typeof data !== 'object' || data === null) {
      validator.addError('preferences', 'must be an object');
      return validator.getResult();
    }

    const { notifications, voice, display, privacy } = data as UserPreferencesRequest;

    // Validate notifications object
    if (notifications !== undefined) {
      if (typeof notifications !== 'object' || notifications === null) {
        validator.addError('notifications', 'must be an object');
      } else {
        validator
          .boolean(notifications.soundEffects, 'notifications.soundEffects')
          .boolean(notifications.voiceAlerts, 'notifications.voiceAlerts')
          .boolean(notifications.systemNotifications, 'notifications.systemNotifications');
      }
    }

    // Validate voice object
    if (voice !== undefined) {
      if (typeof voice !== 'object' || voice === null) {
        validator.addError('voice', 'must be an object');
      } else {
        validator
          .boolean(voice.autoSend, 'voice.autoSend')
          .number(voice.silenceThreshold, 'voice.silenceThreshold', 1, 10)
          .oneOf(voice.voiceQuality, 'voice.voiceQuality', ['low', 'medium', 'high']);
      }
    }

    // Validate display object
    if (display !== undefined) {
      if (typeof display !== 'object' || display === null) {
        validator.addError('display', 'must be an object');
      } else {
        validator
          .oneOf(display.theme, 'display.theme', ['light', 'dark', 'system'])
          .optionalString(display.language, 'display.language', 10)
          .boolean(display.reducedMotion, 'display.reducedMotion');
      }
    }

    // Validate privacy object
    if (privacy !== undefined) {
      if (typeof privacy !== 'object' || privacy === null) {
        validator.addError('privacy', 'must be an object');
      } else {
        validator
          .boolean(privacy.saveConversations, 'privacy.saveConversations')
          .boolean(privacy.shareUsageData, 'privacy.shareUsageData')
          .boolean(privacy.showOnlineStatus, 'privacy.showOnlineStatus');
      }
    }

    return validator.getResult();
  },

  /**
   * Validate star creation request
   */
  createStar: (data: unknown) => {
    const validator = createValidator();

    if (typeof data !== 'object' || data === null) {
      validator.addError('body', 'must be an object');
      return validator.getResult();
    }

    const { itemType, itemId, tags, priority } = data as CreateStarRequest;

    return validator
      .required(itemType, 'itemType', 50)
      .oneOf(itemType, 'itemType', ['message', 'session', 'agent', 'conversation-starter'])
      .required(itemId, 'itemId', 100)
      .stringArray(tags || [], 'tags', 20, 50)
      .oneOf(priority || 'medium', 'priority', ['low', 'medium', 'high'])
      .getResult();
  },

  /**
   * Validate tag creation request
   */
  createTag: (data: unknown) => {
    const validator = createValidator();

    if (typeof data !== 'object' || data === null) {
      validator.addError('body', 'must be an object');
      return validator.getResult();
    }

    const { name, color, category, description } = data as CreateTagRequest;

    // Validate color format if provided
    const isValidColor = (colorStr: string) => {
      return /^#([0-9A-Fa-f]{3}){1,2}$/.test(colorStr);
    };

    return validator
      .required(name, 'name', 50)
      .custom(!color || isValidColor(color), 'color', 'must be a valid hex color (e.g., #FF0000)')
      .optionalString(category, 'category', 50)
      .optionalString(description, 'description', 200)
      .getResult();
  }
};
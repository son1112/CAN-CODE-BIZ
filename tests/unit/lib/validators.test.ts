import { createValidator, Validator, validators } from '@/lib/validators';

describe('Validator class', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = createValidator();
  });

  describe('required method', () => {
    it('should pass for valid string', () => {
      const result = validator.required('test', 'field').getResult();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for undefined value', () => {
      const result = validator.required(undefined, 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'is required' }]);
    });

    it('should fail for null value', () => {
      const result = validator.required(null, 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'is required' }]);
    });

    it('should fail for empty string', () => {
      const result = validator.required('', 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'is required' }]);
    });

    it('should fail for non-string value', () => {
      const result = validator.required(123, 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be a string' }]);
    });

    it('should fail for whitespace-only string', () => {
      const result = validator.required('   ', 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'cannot be empty' }]);
    });

    it('should fail for string exceeding max length', () => {
      const result = validator.required('toolong', 'field', 5).getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be less than 5 characters' }]);
    });
  });

  describe('optionalString method', () => {
    it('should pass for undefined', () => {
      const result = validator.optionalString(undefined, 'field').getResult();
      expect(result.isValid).toBe(true);
    });

    it('should pass for valid string', () => {
      const result = validator.optionalString('test', 'field').getResult();
      expect(result.isValid).toBe(true);
    });

    it('should fail for non-string value', () => {
      const result = validator.optionalString(123, 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be a string' }]);
    });

    it('should fail for string exceeding max length', () => {
      const result = validator.optionalString('toolong', 'field', 5).getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be less than 5 characters' }]);
    });
  });

  describe('array method', () => {
    it('should pass for valid array', () => {
      const result = validator.array([1, 2, 3], 'field').getResult();
      expect(result.isValid).toBe(true);
    });

    it('should fail for non-array value', () => {
      const result = validator.array('not array', 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be an array' }]);
    });

    it('should fail for array exceeding max items', () => {
      const result = validator.array([1, 2, 3], 'field', 2).getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must have at most 2 items' }]);
    });
  });

  describe('stringArray method', () => {
    it('should pass for valid string array', () => {
      const result = validator.stringArray(['a', 'b', 'c'], 'field').getResult();
      expect(result.isValid).toBe(true);
    });

    it('should fail for non-string items', () => {
      const result = validator.stringArray(['a', 123, 'c'], 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field[1]', message: 'must be a string' }]);
    });

    it('should fail for empty string items', () => {
      const result = validator.stringArray(['a', '', 'c'], 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field[1]', message: 'cannot be empty' }]);
    });

    it('should fail for items exceeding max length', () => {
      const result = validator.stringArray(['a', 'toolong', 'c'], 'field', 10, 5).getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field[1]', message: 'must be less than 5 characters' }]);
    });
  });

  describe('number method', () => {
    it('should pass for valid number', () => {
      const result = validator.number(42, 'field').getResult();
      expect(result.isValid).toBe(true);
    });

    it('should fail for non-number value', () => {
      const result = validator.number('not a number', 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be a valid number' }]);
    });

    it('should fail for NaN', () => {
      const result = validator.number(NaN, 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be a valid number' }]);
    });

    it('should fail for number below minimum', () => {
      const result = validator.number(5, 'field', 10).getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be at least 10' }]);
    });

    it('should fail for number above maximum', () => {
      const result = validator.number(15, 'field', 0, 10).getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be at most 10' }]);
    });
  });

  describe('integer method', () => {
    it('should pass for valid integer', () => {
      const result = validator.integer(42, 'field').getResult();
      expect(result.isValid).toBe(true);
    });

    it('should fail for float number', () => {
      const result = validator.integer(42.5, 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be an integer' }]);
    });

    it('should fail for non-number value', () => {
      const result = validator.integer('not a number', 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be an integer' }]);
    });
  });

  describe('boolean method', () => {
    it('should pass for true', () => {
      const result = validator.boolean(true, 'field').getResult();
      expect(result.isValid).toBe(true);
    });

    it('should pass for false', () => {
      const result = validator.boolean(false, 'field').getResult();
      expect(result.isValid).toBe(true);
    });

    it('should fail for non-boolean value', () => {
      const result = validator.boolean('not boolean', 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be a boolean' }]);
    });
  });

  describe('email method', () => {
    it('should pass for valid email', () => {
      const result = validator.email('user@example.com', 'field').getResult();
      expect(result.isValid).toBe(true);
    });

    it('should fail for invalid email format', () => {
      const result = validator.email('invalid-email', 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be a valid email address' }]);
    });

    it('should fail for non-string value', () => {
      const result = validator.email(123, 'field').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be a string' }]);
    });
  });

  describe('oneOf method', () => {
    it('should pass for allowed value', () => {
      const result = validator.oneOf('option1', 'field', ['option1', 'option2']).getResult();
      expect(result.isValid).toBe(true);
    });

    it('should fail for disallowed value', () => {
      const result = validator.oneOf('option3', 'field', ['option1', 'option2']).getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'must be one of: option1, option2' }]);
    });
  });

  describe('custom method', () => {
    it('should pass for true condition', () => {
      const result = validator.custom(true, 'field', 'custom error').getResult();
      expect(result.isValid).toBe(true);
    });

    it('should fail for false condition', () => {
      const result = validator.custom(false, 'field', 'custom error').getResult();
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'field', message: 'custom error' }]);
    });
  });

  describe('reset method', () => {
    it('should clear all errors', () => {
      validator.required('', 'field');
      expect(validator.getResult().isValid).toBe(false);

      validator.reset();
      expect(validator.getResult().isValid).toBe(true);
      expect(validator.getResult().errors).toHaveLength(0);
    });
  });
});

describe('validators object', () => {
  describe('createSession', () => {
    it('should pass for valid session data', () => {
      const validData = {
        name: 'Test Session',
        tags: ['tag1', 'tag2'],
        conversationStarter: 'Hello there!'
      };
      const result = validators.createSession(validData);
      expect(result.isValid).toBe(true);
    });

    it('should fail for non-object data', () => {
      const result = validators.createSession('not an object');
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([{ field: 'body', message: 'must be an object' }]);
    });
  });

  describe('createStar', () => {
    it('should pass for valid star data', () => {
      const validData = {
        itemType: 'message',
        itemId: 'msg123',
        tags: ['important'],
        priority: 'high'
      };
      const result = validators.createStar(validData);
      expect(result.isValid).toBe(true);
    });

    it('should fail for invalid itemType', () => {
      const invalidData = {
        itemType: 'invalid-type',
        itemId: 'msg123'
      };
      const result = validators.createStar(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'itemType',
        message: 'must be one of: message, session, agent, conversation-starter'
      });
    });

    it('should fail for missing required fields', () => {
      const invalidData = {};
      const result = validators.createStar(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'itemType', message: 'is required' });
      expect(result.errors).toContainEqual({ field: 'itemId', message: 'is required' });
    });
  });
});
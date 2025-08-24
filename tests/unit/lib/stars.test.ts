import {
  getStarIcon,
  getStarDisplayName,
  getPriorityColor,
  getPriorityIcon,
  deriveCategory
} from '@/lib/stars';

describe('stars utility functions', () => {
  describe('getStarIcon', () => {
    it('should return correct icon for message', () => {
      expect(getStarIcon('message')).toBe('💬');
    });

    it('should return correct icon for session', () => {
      expect(getStarIcon('session')).toBe('📝');
    });

    it('should return correct icon for agent', () => {
      expect(getStarIcon('agent')).toBe('🤖');
    });

    it('should return correct icon for conversation-starter', () => {
      expect(getStarIcon('conversation-starter')).toBe('💡');
    });

    it('should return correct icon for code-snippet', () => {
      expect(getStarIcon('code-snippet')).toBe('💻');
    });

    it('should return default icon for unknown type', () => {
      expect(getStarIcon('unknown-type' as any)).toBe('⭐');
    });
  });

  describe('getStarDisplayName', () => {
    it('should return correct display name for message', () => {
      expect(getStarDisplayName('message')).toBe('Message');
    });

    it('should return correct display name for session', () => {
      expect(getStarDisplayName('session')).toBe('Session');
    });

    it('should return correct display name for agent', () => {
      expect(getStarDisplayName('agent')).toBe('Agent');
    });

    it('should return correct display name for conversation-starter', () => {
      expect(getStarDisplayName('conversation-starter')).toBe('Conversation Starter');
    });

    it('should return correct display name for code-snippet', () => {
      expect(getStarDisplayName('code-snippet')).toBe('Code Snippet');
    });

    it('should return default display name for unknown type', () => {
      expect(getStarDisplayName('unknown-type' as any)).toBe('Item');
    });
  });

  describe('getPriorityColor', () => {
    it('should return red colors for high priority', () => {
      expect(getPriorityColor('high')).toBe('text-red-600 bg-red-100');
    });

    it('should return yellow colors for medium priority', () => {
      expect(getPriorityColor('medium')).toBe('text-yellow-600 bg-yellow-100');
    });

    it('should return green colors for low priority', () => {
      expect(getPriorityColor('low')).toBe('text-green-600 bg-green-100');
    });

    it('should return default gray colors for unknown priority', () => {
      expect(getPriorityColor('unknown' as any)).toBe('text-gray-600 bg-gray-100');
    });
  });

  describe('getPriorityIcon', () => {
    it('should return red circle for high priority', () => {
      expect(getPriorityIcon('high')).toBe('🔴');
    });

    it('should return yellow circle for medium priority', () => {
      expect(getPriorityIcon('medium')).toBe('🟡');
    });

    it('should return green circle for low priority', () => {
      expect(getPriorityIcon('low')).toBe('🟢');
    });

    it('should return white circle for unknown priority', () => {
      expect(getPriorityIcon('unknown' as any)).toBe('⚪');
    });
  });

  describe('deriveCategory', () => {
    it('should return "Chat" for message without specific agent', () => {
      expect(deriveCategory('message')).toBe('Chat');
    });

    it('should return "Real Estate" for real estate advisor message', () => {
      const context = { agentId: 'real-estate-advisor' };
      expect(deriveCategory('message', context)).toBe('Real Estate');
    });

    it('should return "Chat" for message with other agent', () => {
      const context = { agentId: 'other-agent' };
      expect(deriveCategory('message', context)).toBe('Chat');
    });

    it('should return "Conversations" for session', () => {
      expect(deriveCategory('session')).toBe('Conversations');
    });

    it('should return "AI Assistants" for agent', () => {
      expect(deriveCategory('agent')).toBe('AI Assistants');
    });

    it('should return "Prompts" for conversation-starter', () => {
      expect(deriveCategory('conversation-starter')).toBe('Prompts');
    });

    it('should return "Code" for code-snippet', () => {
      expect(deriveCategory('code-snippet')).toBe('Code');
    });

    it('should return "General" for unknown type', () => {
      expect(deriveCategory('unknown-type' as any)).toBe('General');
    });

    it('should handle empty context object', () => {
      expect(deriveCategory('message', {})).toBe('Chat');
    });

    it('should handle undefined context', () => {
      expect(deriveCategory('message', undefined)).toBe('Chat');
    });
  });
});
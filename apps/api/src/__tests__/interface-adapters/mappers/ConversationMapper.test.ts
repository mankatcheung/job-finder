import { describe, it, expect } from 'vitest';
import { ConversationMapper } from '#src/interface-adapters/mappers/ConversationMapper.js';
import type { Conversation } from '#src/domain/conversation/Conversation.js';

describe('ConversationMapper', () => {
  const mapper = new ConversationMapper();

  const conversation: Conversation = {
    id: 'conv-1',
    userId: 'user-1',
    title: 'Which applications have I applied to?',
    createdAt: new Date('2024-03-01T08:00:00.000Z'),
    updatedAt: new Date('2024-03-02T09:00:00.000Z'),
  };

  it('converts createdAt/updatedAt to ISO strings', () => {
    const dto = mapper.toDTO(conversation);
    expect(dto.createdAt).toBe('2024-03-01T08:00:00.000Z');
    expect(dto.updatedAt).toBe('2024-03-02T09:00:00.000Z');
  });

  it('passes scalar fields through unchanged', () => {
    const dto = mapper.toDTO(conversation);

    expect(dto.id).toBe('conv-1');
    expect(dto.title).toBe('Which applications have I applied to?');
  });

  it('preserves a null title', () => {
    const dto = mapper.toDTO({ ...conversation, title: null });
    expect(dto.title).toBeNull();
  });

  it('does not leak userId onto the DTO', () => {
    const dto = mapper.toDTO(conversation) as Record<string, unknown>;
    expect(dto.userId).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';
import { LoginEventMapper } from '@/interface-adapters/mappers/LoginEventMapper.js';
import type { LoginEvent } from '@/domain/loginEvent/LoginEvent.js';

describe('LoginEventMapper', () => {
  const mapper = new LoginEventMapper();

  const event: LoginEvent = {
    id: 'event-1',
    userId: 'user-1',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date('2024-03-01T08:00:00.000Z'),
  };

  it('converts createdAt to an ISO string', () => {
    const dto = mapper.toDTO(event);
    expect(dto.createdAt).toBe('2024-03-01T08:00:00.000Z');
  });

  it('passes scalar fields through unchanged', () => {
    const dto = mapper.toDTO(event);

    expect(dto.id).toBe('event-1');
    expect(dto.ipAddress).toBe('127.0.0.1');
    expect(dto.userAgent).toBe('Mozilla/5.0');
  });

  it('preserves null ipAddress/userAgent', () => {
    const dto = mapper.toDTO({ ...event, ipAddress: null, userAgent: null });

    expect(dto.ipAddress).toBeNull();
    expect(dto.userAgent).toBeNull();
  });
});

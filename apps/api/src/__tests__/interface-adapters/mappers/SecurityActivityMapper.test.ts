import { describe, it, expect } from 'vitest';
import { SecurityActivityMapper } from '#src/interface-adapters/mappers/SecurityActivityMapper.js';
import type { SecurityActivityItem } from '#src/use-cases/securityEvents/IGetSecurityActivityUseCase.js';

describe('SecurityActivityMapper', () => {
  const mapper = new SecurityActivityMapper();

  const item: SecurityActivityItem = {
    id: 'event-1',
    eventType: 'password_changed',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date('2024-03-01T08:00:00.000Z'),
  };

  it('converts createdAt to an ISO string', () => {
    const dto = mapper.toDTO(item);
    expect(dto.createdAt).toBe('2024-03-01T08:00:00.000Z');
  });

  it('passes scalar fields through unchanged', () => {
    const dto = mapper.toDTO(item);

    expect(dto.id).toBe('event-1');
    expect(dto.eventType).toBe('password_changed');
    expect(dto.ipAddress).toBe('127.0.0.1');
    expect(dto.userAgent).toBe('Mozilla/5.0');
  });

  it('preserves the login event type', () => {
    const dto = mapper.toDTO({ ...item, eventType: 'login' });
    expect(dto.eventType).toBe('login');
  });

  it('preserves null ipAddress/userAgent', () => {
    const dto = mapper.toDTO({ ...item, ipAddress: null, userAgent: null });

    expect(dto.ipAddress).toBeNull();
    expect(dto.userAgent).toBeNull();
  });
});

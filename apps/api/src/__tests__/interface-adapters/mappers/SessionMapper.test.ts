import { describe, it, expect } from 'vitest';
import { SessionMapper } from '#src/interface-adapters/mappers/SessionMapper.js';
import { makeSession } from '#src/__tests__/helpers/mocks.js';

describe('SessionMapper', () => {
  const mapper = new SessionMapper();

  it('converts lastUsedAt and createdAt to ISO strings', () => {
    const session = makeSession({
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      lastUsedAt: new Date('2024-02-01T00:00:00.000Z'),
    });

    const dto = mapper.toDTO(session, undefined);

    expect(dto.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(dto.lastUsedAt).toBe('2024-02-01T00:00:00.000Z');
  });

  it('marks the session current when its id matches the given current session id', () => {
    const session = makeSession({ id: 'session-abc' });

    expect(mapper.toDTO(session, 'session-abc').current).toBe(true);
    expect(mapper.toDTO(session, 'session-xyz').current).toBe(false);
    expect(mapper.toDTO(session, undefined).current).toBe(false);
  });

  it('passes userAgent and ipAddress through unchanged, including null', () => {
    const session = makeSession({ userAgent: null, ipAddress: null });

    const dto = mapper.toDTO(session, undefined);

    expect(dto.userAgent).toBeNull();
    expect(dto.ipAddress).toBeNull();
  });

  it('does not include userId on the DTO', () => {
    const session = makeSession();

    const dto = mapper.toDTO(session, undefined);

    expect(dto).not.toHaveProperty('userId');
  });
});

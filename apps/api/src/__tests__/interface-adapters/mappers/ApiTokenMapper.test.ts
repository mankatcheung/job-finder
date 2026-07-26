import { describe, it, expect } from 'vitest';
import { ApiTokenMapper } from '#src/interface-adapters/mappers/ApiTokenMapper.js';
import { makeApiToken } from '#src/__tests__/helpers/mocks.js';

describe('ApiTokenMapper', () => {
  const mapper = new ApiTokenMapper();

  it('converts createdAt and lastUsedAt to ISO strings', () => {
    const token = makeApiToken({
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      lastUsedAt: new Date('2024-02-01T00:00:00.000Z'),
    });

    const dto = mapper.toDTO(token);

    expect(dto.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(dto.lastUsedAt).toBe('2024-02-01T00:00:00.000Z');
  });

  it('maps a null lastUsedAt to null instead of throwing', () => {
    const token = makeApiToken({ lastUsedAt: null });

    const dto = mapper.toDTO(token);

    expect(dto.lastUsedAt).toBeNull();
  });

  it('does not include the tokenHash on the DTO', () => {
    const token = makeApiToken();

    const dto = mapper.toDTO(token);

    expect(dto).not.toHaveProperty('tokenHash');
  });

  it('passes id, userId, name and scope through unchanged', () => {
    const token = makeApiToken({
      id: 'token-xyz',
      userId: 'user-abc',
      name: 'CI token',
      scope: 'read',
    });

    const dto = mapper.toDTO(token);

    expect(dto.id).toBe('token-xyz');
    expect(dto.userId).toBe('user-abc');
    expect(dto.name).toBe('CI token');
    expect(dto.scope).toBe('read');
  });
});

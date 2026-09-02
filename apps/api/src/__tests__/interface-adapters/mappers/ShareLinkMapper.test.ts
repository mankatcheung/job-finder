import { describe, it, expect } from 'vitest';
import { ShareLinkMapper } from '#src/interface-adapters/mappers/ShareLinkMapper.js';
import { makeShareLink } from '#src/__tests__/helpers/mocks/shareLinks.js';

describe('ShareLinkMapper', () => {
  const mapper = new ShareLinkMapper();

  it('converts createdAt and lastUsedAt to ISO strings', () => {
    const link = makeShareLink({
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      lastUsedAt: new Date('2024-02-01T00:00:00.000Z'),
    });

    const dto = mapper.toDTO(link);

    expect(dto.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(dto.lastUsedAt).toBe('2024-02-01T00:00:00.000Z');
  });

  it('maps a null lastUsedAt to null instead of throwing', () => {
    const link = makeShareLink({ lastUsedAt: null });

    const dto = mapper.toDTO(link);

    expect(dto.lastUsedAt).toBeNull();
  });

  it('does not include the tokenHash on the DTO', () => {
    const link = makeShareLink();

    const dto = mapper.toDTO(link);

    expect(dto).not.toHaveProperty('tokenHash');
  });

  it('passes id, userId and name through unchanged', () => {
    const link = makeShareLink({ id: 'link-xyz', userId: 'user-abc', name: 'For my coach' });

    const dto = mapper.toDTO(link);

    expect(dto.id).toBe('link-xyz');
    expect(dto.userId).toBe('user-abc');
    expect(dto.name).toBe('For my coach');
  });
});

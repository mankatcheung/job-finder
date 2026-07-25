import { describe, it, expect } from 'vitest';
import { OAuthAccountMapper } from '@/interface-adapters/mappers/OAuthAccountMapper.js';
import { makeOAuthAccount } from '@/__tests__/helpers/mocks.js';

describe('OAuthAccountMapper', () => {
  it('maps the domain entity to a DTO with an ISO createdAt', () => {
    const account = makeOAuthAccount({
      provider: 'github',
      email: 'jeff@example.com',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    const mapper = new OAuthAccountMapper();

    expect(mapper.toDTO(account)).toEqual({
      provider: 'github',
      email: 'jeff@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  });
});

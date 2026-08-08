import { describe, it, expect, vi } from 'vitest';
import { ShareLinkResolver } from '#src/interface-adapters/resolvers/ShareLinkResolver.js';
import { ShareLinkMapper } from '#src/interface-adapters/mappers/ShareLinkMapper.js';
import type { CreateShareLinkUseCase } from '#src/use-cases/shareLinks/CreateShareLinkUseCase.js';
import type { DeleteShareLinkUseCase } from '#src/use-cases/shareLinks/DeleteShareLinkUseCase.js';
import type { ListShareLinksUseCase } from '#src/use-cases/shareLinks/ListShareLinksUseCase.js';
import type {
  GetSharedSummaryUseCase,
  SharedSummary,
} from '#src/use-cases/shareLinks/GetSharedSummaryUseCase.js';
import type { ShareLink } from '#src/domain/shareLink/ShareLink.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeLink = (overrides?: Partial<ShareLink>): ShareLink => ({
  id: 'share-link-1',
  userId: 'user-1',
  name: 'For my mentor',
  tokenHash: 'hash',
  lastUsedAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

const makeSummary = (overrides?: Partial<SharedSummary>): SharedSummary => ({
  statusCounts: [{ status: 'applied', count: 3 }],
  totalApplications: 3,
  totalInterviews: 1,
  upcomingInterviews: 1,
  applicationsUpdatedLast7Days: 2,
  generatedAt: new Date('2024-06-15T12:00:00.000Z'),
  ...overrides,
});

const makeDeps = (overrides?: object) => ({
  createShareLinkUseCase: stub<CreateShareLinkUseCase>({ execute: vi.fn() }),
  deleteShareLinkUseCase: stub<DeleteShareLinkUseCase>({ execute: vi.fn() }),
  listShareLinksUseCase: stub<ListShareLinksUseCase>({ execute: vi.fn() }),
  getSharedSummaryUseCase: stub<GetSharedSummaryUseCase>({ execute: vi.fn() }),
  shareLinkMapper: new ShareLinkMapper(),
  ...overrides,
});

describe('ShareLinkResolver', () => {
  it('createShareLink: creates a link and returns the raw token alongside the mapped fields', async () => {
    const link = makeLink();
    const deps = makeDeps({
      createShareLinkUseCase: stub<CreateShareLinkUseCase>({
        execute: vi.fn().mockResolvedValue({ shareLink: link, rawToken: 'jfsl_rawvalue' }),
      }),
    });

    const resolver = new ShareLinkResolver(deps);
    const result = await resolver.createShareLink('user-1', 'For my mentor');

    expect(deps.createShareLinkUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'For my mentor',
    });
    expect(result).toEqual({
      id: 'share-link-1',
      name: 'For my mentor',
      token: 'jfsl_rawvalue',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
  });

  it('deleteShareLink: deletes and returns true', async () => {
    const deps = makeDeps({
      deleteShareLinkUseCase: stub<DeleteShareLinkUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new ShareLinkResolver(deps);
    const result = await resolver.deleteShareLink('user-1', 'share-link-1');

    expect(deps.deleteShareLinkUseCase.execute).toHaveBeenCalledWith('share-link-1', 'user-1');
    expect(result).toBe(true);
  });

  it("listShareLinks: returns mapped DTOs for all of the user's links", async () => {
    const links = [makeLink({ id: 'share-link-1' }), makeLink({ id: 'share-link-2' })];
    const deps = makeDeps({
      listShareLinksUseCase: stub<ListShareLinksUseCase>({
        execute: vi.fn().mockResolvedValue(links),
      }),
    });

    const resolver = new ShareLinkResolver(deps);
    const result = await resolver.listShareLinks('user-1');

    expect(deps.listShareLinksUseCase.execute).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('share-link-1');
    expect(result[1].id).toBe('share-link-2');
  });

  it('getSharedSummary: returns the summary with generatedAt as an ISO string', async () => {
    const summary = makeSummary();
    const deps = makeDeps({
      getSharedSummaryUseCase: stub<GetSharedSummaryUseCase>({
        execute: vi.fn().mockResolvedValue(summary),
      }),
    });

    const resolver = new ShareLinkResolver(deps);
    const result = await resolver.getSharedSummary('jfsl_abc');

    expect(deps.getSharedSummaryUseCase.execute).toHaveBeenCalledWith('jfsl_abc');
    expect(result).toEqual({
      ...summary,
      generatedAt: '2024-06-15T12:00:00.000Z',
    });
  });

  it('getSharedSummary: returns null for an invalid or revoked token without throwing', async () => {
    const deps = makeDeps({
      getSharedSummaryUseCase: stub<GetSharedSummaryUseCase>({
        execute: vi.fn().mockResolvedValue(null),
      }),
    });

    const resolver = new ShareLinkResolver(deps);
    const result = await resolver.getSharedSummary('jfsl_invalid');

    expect(result).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockHasSessionCookie } = vi.hoisted(() => ({
  mockHasSessionCookie: vi.fn().mockReturnValue(false),
}));

vi.mock('#/graphql/client', () => ({
  hasSessionCookie: mockHasSessionCookie,
  gqlClient: {},
}));

// The layout pulls in the whole authenticated app; the guard is what's
// under test here.
vi.mock('#/routes/_authenticated/-components/AuthenticatedLayout', () => ({
  AuthenticatedLayout: () => null,
}));

type RedirectError = Error & { redirectOpts?: { to: string; search?: unknown } };

/** Mirrors TanStack Router: `redirect` aborts navigation by throwing. */
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    redirect: (opts: { to: string; search?: unknown }): never => {
      const error = new Error('REDIRECT') as RedirectError;
      error.redirectOpts = opts;
      throw error;
    },
  };
});

interface BeforeLoadOpts {
  location: { href: string };
}

async function loadGuard(): Promise<(opts: BeforeLoadOpts) => unknown> {
  const mod = await import('#/routes/_authenticated/route');
  // The generated Route type hides its own options object; reach past it.
  const { beforeLoad } =
    (mod.Route as unknown as { options?: { beforeLoad?: (opts: BeforeLoadOpts) => unknown } })
      .options ?? (mod.Route as unknown as { beforeLoad: (opts: BeforeLoadOpts) => unknown });
  if (!beforeLoad) throw new Error('guard not found');
  return (opts) => beforeLoad(opts);
}

describe('_authenticated route guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasSessionCookie.mockReturnValue(false);
  });

  it('redirects unauthenticated visitors to /login carrying where they were headed', async () => {
    const guard = await loadGuard();

    let caught: RedirectError | undefined;
    try {
      guard({ location: { href: '/applications?status=applied' } });
    } catch (err) {
      caught = err as RedirectError;
    }

    expect(caught).toBeDefined();
    expect(caught!.redirectOpts).toEqual({
      to: '/login',
      search: { returnTo: '/applications?status=applied' },
    });
  });

  it('lets authenticated visitors through untouched', async () => {
    mockHasSessionCookie.mockReturnValue(true);
    const guard = await loadGuard();

    expect(() => guard({ location: { href: '/dashboard' } })).not.toThrow();
  });
});

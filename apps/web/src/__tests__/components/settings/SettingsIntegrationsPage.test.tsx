import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: object) => ({ ...opts, useSearch: () => ({}) }),
  useNavigate: () => vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({ handler: (fn: () => unknown) => fn }),
}));

vi.mock('@tanstack/react-start/server', () => ({
  getCookie: vi.fn(),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

vi.mock('#/lib/queryClient', () => ({
  queryClient: { clear: vi.fn(), resetQueries: vi.fn() },
}));

vi.mock('@vercel/blob/client', () => ({
  put: vi.fn(),
}));

import { ThemeProvider } from '#/lib/theme';
import { SettingsIntegrationsPage } from '#/routes/_authenticated/settings/-components/SettingsIntegrationsPage';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

describe('SettingsIntegrationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGqlRequest.mockResolvedValue({
      me: {
        id: 'user-1',
        email: 'test@example.com',
        name: null,
        timezone: null,
        targetRole: null,
        avatarUrl: null,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the integrations page', async () => {
    render(<SettingsIntegrationsPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalled();
    });
  });

  describe('API token scope (JEF-170)', () => {
    /** The page issues several queries; resolve each by the operation it names. */
    function respondByOperation(tokens: Array<Record<string, unknown>> = []) {
      mockGqlRequest.mockImplementation((doc: string) => {
        if (typeof doc === 'string' && doc.includes('query ApiTokens')) {
          return Promise.resolve({ apiTokens: tokens });
        }
        if (typeof doc === 'string' && doc.includes('mutation CreateApiToken')) {
          return Promise.resolve({
            createApiToken: {
              id: 't1',
              name: 'n',
              token: 'trakwyn_secret',
              scope: 'read',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          });
        }
        return Promise.resolve({
          me: {
            id: 'user-1',
            email: 'a@b.c',
            name: null,
            timezone: null,
            targetRole: null,
            avatarUrl: null,
          },
        });
      });
    }

    it('defaults new tokens to read-only, so MCP does not require full account access', async () => {
      respondByOperation();
      render(<SettingsIntegrationsPage />, { wrapper: Wrapper });

      const nameInput = await screen.findByPlaceholderText('e.g. CI pipeline');
      fireEvent.change(nameInput, { target: { value: 'my mcp client' } });
      fireEvent.click(screen.getByRole('button', { name: /create token/i }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(
          expect.stringContaining('mutation CreateApiToken'),
          { name: 'my mcp client', scope: 'read' },
        );
      });
    });

    it('sends full scope only when explicitly chosen', async () => {
      respondByOperation();
      render(<SettingsIntegrationsPage />, { wrapper: Wrapper });

      const nameInput = await screen.findByPlaceholderText('e.g. CI pipeline');
      fireEvent.change(nameInput, { target: { value: 'ci' } });
      fireEvent.change(screen.getByLabelText('Access'), { target: { value: 'full' } });
      fireEvent.click(screen.getByRole('button', { name: /create token/i }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(
          expect.stringContaining('mutation CreateApiToken'),
          { name: 'ci', scope: 'full' },
        );
      });
    });

    it("shows each existing token's scope, so pre-existing full-access tokens are visible", async () => {
      respondByOperation([
        {
          id: 'a',
          name: 'old token',
          scope: 'full',
          lastUsedAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'b',
          name: 'mcp token',
          scope: 'read',
          lastUsedAt: null,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
      render(<SettingsIntegrationsPage />, { wrapper: Wrapper });

      expect(await screen.findByText('old token')).toBeInTheDocument();
      expect(screen.getByText('mcp token')).toBeInTheDocument();
      expect(screen.getAllByText('Full access').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Read-only').length).toBeGreaterThan(0);
    });
  });
});

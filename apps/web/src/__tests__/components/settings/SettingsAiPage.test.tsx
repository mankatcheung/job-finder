import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: object) => ({ ...opts, useSearch: () => ({}) }),
  useNavigate: () => vi.fn(),
  redirect: vi.fn(),
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

import { ThemeProvider } from '#/lib/theme';
import { SettingsAiPage } from '#/routes/_authenticated/settings/-components/SettingsAiPage';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

describe('SettingsAiPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGqlRequest.mockResolvedValue({
      llmApiKeys: [],
      me: { defaultLlmProvider: null, customAiPrompt: null },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the AI features section', async () => {
    render(<SettingsAiPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalled();
    });
    expect(screen.getByText('AI features')).toBeInTheDocument();
  });

  it('points to the setup guide for bring-your-own-key AI (JEF-231)', () => {
    render(<SettingsAiPage />, { wrapper: Wrapper });

    expect(screen.getByRole('link', { name: 'Read the guide' })).toHaveAttribute(
      'href',
      '/ai-mcp-setup',
    );
  });

  it("shows an existing key's provider and default badge", async () => {
    mockGqlRequest.mockResolvedValue({
      llmApiKeys: [{ provider: 'openrouter', model: null, baseUrl: null }],
      me: { defaultLlmProvider: 'openrouter', customAiPrompt: null },
    });
    render(<SettingsAiPage />, { wrapper: Wrapper });

    // "OpenRouter" alone would also match the (still-present) dropdown option
    // before the list loads, so wait on "Default" — it only ever comes from
    // the loaded key row — then confirm it's on the row for that provider.
    const defaultBadge = await screen.findByText('Default');
    expect(defaultBadge.closest('li')).toHaveTextContent('OpenRouter');
  });
});

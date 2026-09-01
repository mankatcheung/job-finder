import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  describe('cross-application context (JEF-249)', () => {
    it('renders unchecked by default', async () => {
      render(<SettingsAiPage />, { wrapper: Wrapper });

      const toggle = await screen.findByRole('checkbox', {
        name: 'Use context from other applications',
      });
      expect(toggle).not.toBeChecked();
    });

    it('reflects the saved preference when already enabled', async () => {
      mockGqlRequest.mockResolvedValue({
        llmApiKeys: [],
        me: { defaultLlmProvider: null, customAiPrompt: null, useCrossApplicationContext: true },
      });
      render(<SettingsAiPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(
          screen.getByRole('checkbox', { name: 'Use context from other applications' }),
        ).toBeChecked();
      });
    });

    it('saves the preference immediately when toggled', async () => {
      const user = userEvent.setup();
      render(<SettingsAiPage />, { wrapper: Wrapper });
      const toggle = await screen.findByRole('checkbox', {
        name: 'Use context from other applications',
      });

      await user.click(toggle);

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('UpdateProfile'), {
          useCrossApplicationContext: true,
        });
      });
    });

    it('shows an error and leaves the toggle usable when the save fails', async () => {
      mockGqlRequest.mockImplementation((document: string) => {
        if (document.includes('UpdateProfile')) {
          return Promise.reject(new Error('network error'));
        }
        return Promise.resolve({
          llmApiKeys: [],
          me: { defaultLlmProvider: null, customAiPrompt: null, useCrossApplicationContext: false },
        });
      });
      const user = userEvent.setup();
      render(<SettingsAiPage />, { wrapper: Wrapper });
      const toggle = await screen.findByRole('checkbox', {
        name: 'Use context from other applications',
      });

      await user.click(toggle);

      expect(
        await screen.findByText("Couldn't update this setting. Please try again."),
      ).toBeInTheDocument();
      expect(toggle).toBeEnabled();
    });
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
    // before the list loads, so wait for the loaded row itself.
    const row = await screen.findByTestId('llm-provider-row-openrouter');
    expect(row).toHaveTextContent('OpenRouter');
    expect(row).toHaveTextContent('Default');
  });

  describe('testing a saved key (JEF-247)', () => {
    beforeEach(() => {
      mockGqlRequest.mockImplementation((document: string) => {
        if (document.includes('query LlmApiKeys')) {
          return Promise.resolve({
            llmApiKeys: [{ provider: 'openrouter', model: null, baseUrl: null }],
            me: { defaultLlmProvider: 'openrouter', customAiPrompt: null },
          });
        }
        return Promise.resolve({ testLlmApiKey: { ok: true, error: null } });
      });
    });

    it('tests the saved key by provider, without sending an apiKey', async () => {
      const user = userEvent.setup();
      render(<SettingsAiPage />, { wrapper: Wrapper });
      const row = await screen.findByTestId('llm-provider-row-openrouter');

      await user.click(within(row).getByRole('button', { name: 'Test' }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('testLlmApiKey'), {
          provider: 'openrouter',
        });
      });
    });

    it('shows a success message after a successful test', async () => {
      const user = userEvent.setup();
      render(<SettingsAiPage />, { wrapper: Wrapper });
      const row = await screen.findByTestId('llm-provider-row-openrouter');

      await user.click(within(row).getByRole('button', { name: 'Test' }));

      expect(await within(row).findByText('Connection works.')).toBeInTheDocument();
    });

    it('shows the failure message after a failed test', async () => {
      mockGqlRequest.mockImplementation((document: string) => {
        if (document.includes('query LlmApiKeys')) {
          return Promise.resolve({
            llmApiKeys: [{ provider: 'openrouter', model: null, baseUrl: null }],
            me: { defaultLlmProvider: 'openrouter', customAiPrompt: null },
          });
        }
        return Promise.resolve({
          testLlmApiKey: { ok: false, error: 'Invalid API key' },
        });
      });
      const user = userEvent.setup();
      render(<SettingsAiPage />, { wrapper: Wrapper });
      const row = await screen.findByTestId('llm-provider-row-openrouter');

      await user.click(within(row).getByRole('button', { name: 'Test' }));

      expect(await within(row).findByText('Invalid API key')).toBeInTheDocument();
    });
  });

  describe('testing the add-key form before saving (JEF-247)', () => {
    it('disables the Test button until an API key is entered', async () => {
      render(<SettingsAiPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());

      const testButton = screen.getByRole('button', { name: 'Test' });
      expect(testButton).toBeDisabled();

      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('sk-…'), 'sk-123');

      expect(testButton).toBeEnabled();
    });

    it('tests the unsaved form values without persisting anything', async () => {
      mockGqlRequest.mockImplementation((document: string) => {
        if (document.includes('query LlmApiKeys')) {
          return Promise.resolve({
            llmApiKeys: [],
            me: { defaultLlmProvider: null, customAiPrompt: null },
          });
        }
        return Promise.resolve({ testLlmApiKey: { ok: true, error: null } });
      });
      const user = userEvent.setup();
      render(<SettingsAiPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());

      await user.type(screen.getByPlaceholderText('sk-…'), 'sk-123');
      await user.click(screen.getByRole('button', { name: 'Test' }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('testLlmApiKey'), {
          provider: 'openrouter',
          apiKey: 'sk-123',
          model: undefined,
          baseUrl: undefined,
        });
      });
      expect(mockGqlRequest).not.toHaveBeenCalledWith(
        expect.stringContaining('saveLlmApiKey'),
        expect.anything(),
      );
      expect(await screen.findByText('Connection works.')).toBeInTheDocument();
    });

    it('keeps the Test button disabled for a custom provider until baseUrl and model are also filled in', async () => {
      const user = userEvent.setup();
      render(<SettingsAiPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());

      await user.selectOptions(screen.getByRole('combobox'), 'custom');
      await user.type(screen.getByPlaceholderText('sk-…'), 'sk-123');

      const testButton = screen.getByRole('button', { name: 'Test' });
      expect(testButton).toBeDisabled();

      await user.type(
        screen.getByPlaceholderText('https://your-endpoint.example.com/v1/chat/completions'),
        'https://my-llm.example.com',
      );
      expect(testButton).toBeDisabled();

      await user.type(screen.getByPlaceholderText('e.g. gpt-4o-mini'), 'my-model');
      expect(testButton).toBeEnabled();
    });
  });

  describe('progressive disclosure of the add-provider form (redesign)', () => {
    it('opens the form automatically when no provider is configured yet', async () => {
      render(<SettingsAiPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());

      expect(screen.getByPlaceholderText('sk-…')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add provider' })).not.toBeInTheDocument();
    });

    it('collapses the form behind an "Add provider" button once a key exists, and expands it on click', async () => {
      mockGqlRequest.mockResolvedValue({
        llmApiKeys: [{ provider: 'openrouter', model: null, baseUrl: null }],
        me: { defaultLlmProvider: 'openrouter', customAiPrompt: null },
      });
      const user = userEvent.setup();
      render(<SettingsAiPage />, { wrapper: Wrapper });
      await screen.findByTestId('llm-provider-row-openrouter');

      expect(screen.queryByPlaceholderText('sk-…')).not.toBeInTheDocument();
      const addProviderButton = screen.getByRole('button', { name: 'Add provider' });

      await user.click(addProviderButton);

      expect(screen.getByPlaceholderText('sk-…')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add provider' })).not.toBeInTheDocument();
    });

    it('collapses the form again via Cancel, discarding what was typed', async () => {
      mockGqlRequest.mockResolvedValue({
        llmApiKeys: [{ provider: 'openrouter', model: null, baseUrl: null }],
        me: { defaultLlmProvider: 'openrouter', customAiPrompt: null },
      });
      const user = userEvent.setup();
      render(<SettingsAiPage />, { wrapper: Wrapper });
      await screen.findByTestId('llm-provider-row-openrouter');

      await user.click(screen.getByRole('button', { name: 'Add provider' }));
      await user.type(screen.getByPlaceholderText('sk-…'), 'sk-123');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByPlaceholderText('sk-…')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add provider' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Add provider' }));
      expect(screen.getByPlaceholderText('sk-…')).toHaveValue('');
    });

    it('collapses the form again after a successful save', async () => {
      let saved = false;
      mockGqlRequest.mockImplementation((document: string) => {
        if (document.includes('query LlmApiKeys')) {
          return Promise.resolve({
            llmApiKeys: saved ? [{ provider: 'openrouter', model: null, baseUrl: null }] : [],
            me: { defaultLlmProvider: saved ? 'openrouter' : null, customAiPrompt: null },
          });
        }
        if (document.includes('saveLlmApiKey')) {
          saved = true;
          return Promise.resolve({ saveLlmApiKey: true });
        }
        return Promise.resolve({});
      });
      const user = userEvent.setup();
      render(<SettingsAiPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByPlaceholderText('sk-…')).toBeInTheDocument());

      await user.type(screen.getByPlaceholderText('sk-…'), 'sk-123');
      await user.click(screen.getByRole('button', { name: 'Add key' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add provider' })).toBeInTheDocument();
      });
    });
  });
});

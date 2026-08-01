import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest, mockGetQueryData, mockSetQueryData } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
  mockGetQueryData: vi.fn(),
  mockSetQueryData: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => opts,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

vi.mock('#/lib/queryClient', () => ({
  queryClient: { getQueryData: mockGetQueryData, setQueryData: mockSetQueryData },
}));

import { AssistantPage } from '#/routes/_authenticated/assistant';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

describe('AssistantPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetQueryData.mockReturnValue(undefined);
  });

  it('shows suggested questions when there is no persisted history', () => {
    render(<AssistantPage />, { wrapper: Wrapper });

    expect(
      screen.getByText('Ask about your applications, contacts, or interview rounds.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Summarize my interviews this month')).toBeInTheDocument();
  });

  it('renders persisted history seeded from the loader-populated query cache', () => {
    mockGetQueryData.mockReturnValue({
      chatHistory: [
        { role: 'user', content: 'earlier question' },
        { role: 'assistant', content: 'earlier answer' },
      ],
    });

    render(<AssistantPage />, { wrapper: Wrapper });

    expect(screen.getByText('earlier question')).toBeInTheDocument();
    expect(screen.getByText('earlier answer')).toBeInTheDocument();
    // No suggested-questions empty state once there's real history.
    expect(
      screen.queryByText('Ask about your applications, contacts, or interview rounds.'),
    ).not.toBeInTheDocument();
  });

  it('sends a message without a history argument and appends the reply', async () => {
    mockGqlRequest.mockResolvedValue({ sendChatMessage: 'You have 2 active applications.' });
    render(<AssistantPage />, { wrapper: Wrapper });

    fireEvent.change(screen.getByPlaceholderText('Ask a question…'), {
      target: { value: 'how many active applications do I have?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(screen.getByText('You have 2 active applications.')).toBeInTheDocument(),
    );
    expect(screen.getByText('how many active applications do I have?')).toBeInTheDocument();
    expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('sendChatMessage'), {
      message: 'how many active applications do I have?',
    });
  });

  it('clears the conversation after confirming, resetting local state and the query cache', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockGetQueryData.mockReturnValue({
      chatHistory: [{ role: 'user', content: 'earlier question' }],
    });
    mockGqlRequest.mockResolvedValue({ clearChatHistory: true });

    render(<AssistantPage />, { wrapper: Wrapper });
    expect(screen.getByText('earlier question')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    await waitFor(() =>
      expect(
        screen.getByText('Ask about your applications, contacts, or interview rounds.'),
      ).toBeInTheDocument(),
    );
    expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('clearChatHistory'));
    expect(mockSetQueryData).toHaveBeenCalledWith(['chatHistory'], { chatHistory: [] });
  });

  it('does not clear when the confirm dialog is dismissed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockGetQueryData.mockReturnValue({
      chatHistory: [{ role: 'user', content: 'earlier question' }],
    });

    render(<AssistantPage />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.getByText('earlier question')).toBeInTheDocument();
    expect(mockGqlRequest).not.toHaveBeenCalled();
  });

  it('does not show the Clear button when there is no history', () => {
    render(<AssistantPage />, { wrapper: Wrapper });
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });
});

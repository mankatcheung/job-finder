import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

import { AiErrorMessage } from '#/components/AiErrorMessage';
import { AI_LIMIT_REACHED_CODE, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';

describe('AiErrorMessage', () => {
  it('tells a user with no key to add one', () => {
    render(<AiErrorMessage code={AI_NOT_CONFIGURED_CODE} fallback="boom" />);

    expect(screen.getByText(/Add your AI API key/)).toBeInTheDocument();
    expect(screen.queryByText('boom')).not.toBeInTheDocument();
  });

  /**
   * The distinction this component exists for: someone at their limit already
   * has a key, so "add your API key" would be the wrong instruction.
   */
  it('tells a user at their limit to raise it, not to add a key', () => {
    render(<AiErrorMessage code={AI_LIMIT_REACHED_CODE} fallback="boom" />);

    expect(screen.getByText(/reached its monthly token limit/)).toBeInTheDocument();
    expect(screen.queryByText(/Add your AI API key/)).not.toBeInTheDocument();
  });

  it('points both cases at the AI settings page', () => {
    const { unmount } = render(<AiErrorMessage code={AI_NOT_CONFIGURED_CODE} fallback="boom" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/settings/ai');
    unmount();

    render(<AiErrorMessage code={AI_LIMIT_REACHED_CODE} fallback="boom" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/settings/ai');
  });

  it('shows the underlying message for anything else', () => {
    render(<AiErrorMessage code="SOMETHING_ELSE" fallback="Provider timed out" />);

    expect(screen.getByText('Provider timed out')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the underlying message when there is no code at all', () => {
    render(<AiErrorMessage code={undefined} fallback="Network error" />);

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });
});

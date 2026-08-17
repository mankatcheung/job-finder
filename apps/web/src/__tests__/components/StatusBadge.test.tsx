import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '#/routes/_authenticated/-components/StatusBadge';

describe('StatusBadge', () => {
  it('renders the localized status text', () => {
    render(<StatusBadge status="interviewing" />);
    expect(screen.getByText('Interviewing')).toBeInTheDocument();
  });

  it('applies a known status color', () => {
    render(<StatusBadge status="offered" />);
    expect(screen.getByText('Offered')).toHaveClass('bg-green-100');
  });

  it('falls back to the draft style for an unrecognized status', () => {
    render(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toHaveClass('bg-gray-100', 'text-gray-700');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from '../IconButton';

describe('IconButton', () => {
  it('exposes the label as the accessible name', () => {
    render(<IconButton label="Close" icon={<svg />} />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<IconButton label="Delete" icon={<svg />} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the danger variant classes', () => {
    render(<IconButton label="Delete" icon={<svg />} variant="danger" />);
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain(
      'hover:text-red-600',
    );
  });
});

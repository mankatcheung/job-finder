import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from '../Alert';

describe('Alert', () => {
  it('renders its children', () => {
    render(<Alert>Something went wrong.</Alert>);
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('defaults to the error tone', () => {
    render(<Alert>Failed.</Alert>);
    expect(screen.getByText('Failed.').className).toContain('bg-red-50');
  });

  it('applies the success tone', () => {
    render(<Alert tone="success">Saved.</Alert>);
    expect(screen.getByText('Saved.').className).toContain('bg-green-50');
  });

  it('merges additional className', () => {
    render(
      <Alert className="mb-4" tone="error">
        Failed.
      </Alert>,
    );
    const el = screen.getByText('Failed.');
    expect(el.className).toContain('mb-4');
    expect(el.className).toContain('bg-red-50');
  });
});

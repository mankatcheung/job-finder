import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children inside a bordered, rounded container', () => {
    render(<Card>Panel content</Card>);
    const el = screen.getByText('Panel content');
    expect(el.className).toContain('bg-white');
    expect(el.className).toContain('rounded-xl');
    expect(el.className).toContain('border');
  });

  it('applies no default padding, so callers fully control it via className', () => {
    render(<Card data-testid="card">Panel</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).not.toMatch(/\bp-\d/);
  });

  it('merges caller className additively', () => {
    render(
      <Card data-testid="card" className="p-4 space-y-3">
        Panel
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card.className).toContain('p-4');
    expect(card.className).toContain('space-y-3');
    expect(card.className).toContain('bg-white');
  });

  it('forwards arbitrary div props', () => {
    render(
      <Card data-testid="card" onClick={() => {}}>
        Panel
      </Card>,
    );
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});

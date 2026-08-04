import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LogoMark } from '#/components/LogoMark';

describe('LogoMark', () => {
  it('renders an SVG element', () => {
    const { container } = render(<LogoMark />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('uses default size of 24', () => {
    const { container } = render(<LogoMark />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('accepts a custom size prop', () => {
    const { container } = render(<LogoMark size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('applies a custom className', () => {
    const { container } = render(<LogoMark className="my-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('my-class');
  });

  it('has aria-hidden for decorative use', () => {
    const { container } = render(<LogoMark />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('contains the brand blue rectangles and checkmark path', () => {
    const { container } = render(<LogoMark />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(3);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });
});

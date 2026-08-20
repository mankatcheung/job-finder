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

  it('draws two chevrons in brand blue', () => {
    const { container } = render(<LogoMark />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
    for (const path of paths) {
      expect(path).toHaveAttribute('stroke', '#1d4ed8');
    }
  });

  it('gives the trailing chevron a lighter stroke than the leading one', () => {
    const { container } = render(<LogoMark />);
    const [trailing, leading] = container.querySelectorAll('path');

    // The whole point of the mark. Two chevrons at equal weight read as a
    // media control; unequal ones read as a position and the one before it.
    // Equalising these would quietly turn the logo into a fast-forward icon.
    expect(Number(trailing.getAttribute('stroke-width'))).toBeLessThan(
      Number(leading.getAttribute('stroke-width')),
    );
  });
});

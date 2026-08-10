import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders as a text input and forwards value changes', async () => {
    const onChange = vi.fn();
    render(<Input placeholder="Email" onChange={onChange} />);
    await userEvent.type(screen.getByPlaceholderText('Email'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('marks itself aria-invalid and applies error classes when invalid', () => {
    render(<Input placeholder="Email" invalid />);
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.className).toContain('border-red-500');
  });

  it('has no aria-invalid attribute by default', () => {
    render(<Input placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).not.toHaveAttribute('aria-invalid');
  });
});

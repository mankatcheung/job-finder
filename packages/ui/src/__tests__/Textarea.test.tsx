import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
  it('renders as a textarea and forwards value changes', async () => {
    const onChange = vi.fn();
    render(<Textarea placeholder="Notes" onChange={onChange} />);
    const textarea = screen.getByPlaceholderText('Notes');
    expect(textarea.tagName).toBe('TEXTAREA');
    await userEvent.type(textarea, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('is non-resizable by default', () => {
    render(<Textarea placeholder="Notes" />);
    expect(screen.getByPlaceholderText('Notes').className).toContain('resize-none');
  });

  it('marks itself aria-invalid and applies error classes when invalid', () => {
    render(<Textarea placeholder="Notes" invalid />);
    const textarea = screen.getByPlaceholderText('Notes');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea.className).toContain('border-red-500');
  });

  it('has no aria-invalid attribute by default', () => {
    render(<Textarea placeholder="Notes" />);
    expect(screen.getByPlaceholderText('Notes')).not.toHaveAttribute('aria-invalid');
  });

  it('accepts rows and additional className', () => {
    render(<Textarea placeholder="Notes" rows={5} className="h-24" />);
    const textarea = screen.getByPlaceholderText('Notes');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea.className).toContain('h-24');
  });
});

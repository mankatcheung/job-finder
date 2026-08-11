import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

describe('Select', () => {
  it('renders options and forwards value changes', async () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="Status" onChange={onChange}>
        <option value="draft">Draft</option>
        <option value="applied">Applied</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: 'Status' }) as HTMLSelectElement;
    await userEvent.selectOptions(select, 'applied');
    expect(onChange).toHaveBeenCalled();
    expect(select.value).toBe('applied');
  });

  it('marks itself aria-invalid and applies error classes when invalid', () => {
    render(
      <Select aria-label="Status" invalid>
        <option value="draft">Draft</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: 'Status' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select.className).toContain('border-red-500');
  });

  it('has no aria-invalid attribute by default', () => {
    render(
      <Select aria-label="Status">
        <option value="draft">Draft</option>
      </Select>,
    );
    expect(screen.getByRole('combobox', { name: 'Status' })).not.toHaveAttribute('aria-invalid');
  });
});

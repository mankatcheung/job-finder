import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfferForm } from '#/routes/_authenticated/applications/$applicationId/-components/OfferForm';

function fieldFor(labelText: string | RegExp): HTMLElement {
  const label = screen.getByText(labelText);
  const field = label.parentElement?.querySelector('input, select, textarea');
  if (!field) throw new Error(`No field found for label ${String(labelText)}`);
  return field as HTMLElement;
}

describe('OfferForm', () => {
  it('renders with default values when no initialData is given', () => {
    render(<OfferForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(fieldFor('Base Salary *')).toHaveValue(0);
    expect(fieldFor('Currency')).toHaveValue('USD');
    expect(fieldFor('Period')).toHaveValue('yearly');
    expect(screen.getByRole('button', { name: /save offer/i })).toBeDisabled();
  });

  it('renders pre-filled fields from initialData', () => {
    render(
      <OfferForm
        initialData={{
          baseSalary: 150000,
          bonus: 10000,
          equity: '1000 RSUs over 4 years',
          benefits: 'Health insurance',
          costOfLivingAdjustment: 5,
          currency: 'EUR',
          period: 'monthly',
          notes: 'Great team',
        }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(fieldFor('Base Salary *')).toHaveValue(150000);
    expect(fieldFor('Bonus')).toHaveValue(10000);
    expect(fieldFor('Currency')).toHaveValue('EUR');
    expect(fieldFor('Period')).toHaveValue('monthly');
    expect(screen.getByDisplayValue('1000 RSUs over 4 years')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Health insurance')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Great team')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save offer/i })).not.toBeDisabled();
  });

  it('updates fields on change', () => {
    render(<OfferForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(fieldFor('Base Salary *'), { target: { value: '120000' } });
    expect(fieldFor('Base Salary *')).toHaveValue(120000);
  });

  it('calls onSubmit with the current form data on submit', () => {
    const onSubmit = vi.fn();
    render(<OfferForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(fieldFor('Base Salary *'), { target: { value: '120000' } });
    fireEvent.click(screen.getByRole('button', { name: /save offer/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ baseSalary: 120000, currency: 'USD', period: 'yearly' }),
    );
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<OfferForm onSubmit={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables the submit button while baseSalary is 0', () => {
    render(<OfferForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save offer/i })).toBeDisabled();
  });

  it('shows "Saving…" and disables submit when loading', () => {
    render(
      <OfferForm
        initialData={{ baseSalary: 100000 }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        loading
      />,
    );

    const button = screen.getByRole('button', { name: /saving/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mockSetLocale } = vi.hoisted(() => ({
  mockSetLocale: vi.fn(),
}));

vi.mock('#/lib/i18n', () => ({
  LOCALE_OPTIONS: [
    { value: 'en', label: 'English' },
    { value: 'zh-CN', label: '简体中文' },
  ],
  useLocale: () => ({
    locale: 'en',
    setLocale: mockSetLocale,
    t: (key: string) => ({ 'settings.language': 'Language' })[key] ?? key,
  }),
}));

import { MarketingLocalePicker } from '#/components/marketing/MarketingLocalePicker';

describe('MarketingLocalePicker', () => {
  it('lists every supported locale and shows the current one selected', () => {
    render(<MarketingLocalePicker />);

    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toHaveValue('en');
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '简体中文' })).toBeInTheDocument();
  });

  it('calls setLocale with the newly picked value', () => {
    render(<MarketingLocalePicker />);

    const select = screen.getByRole('combobox', { name: 'Language' });
    fireEvent.change(select, { target: { value: 'zh-CN' } });

    expect(mockSetLocale).toHaveBeenCalledWith('zh-CN');
  });
});

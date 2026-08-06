import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LocaleProvider, useLocale } from '#/lib/i18n';

function Probe() {
  const { locale, t, formatNumber } = useLocale();
  return (
    <output>
      {locale}|{t('nav.dashboard')}|{formatNumber(1234567)}
    </output>
  );
}

describe('i18n', () => {
  it('falls back to English when no locale is stored', () => {
    localStorage.removeItem('locale');
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByText(/\|Dashboard\|/)).toBeInTheDocument();
  });

  it('uses a stored supported locale and updates document language', () => {
    localStorage.setItem('locale', 'zh-CN');
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByText(/zh-CN\|仪表盘\|/)).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('zh-CN');
  });
});

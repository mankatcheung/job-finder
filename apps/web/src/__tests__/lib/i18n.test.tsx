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

  it('uses a URL locale and updates document language', () => {
    window.history.replaceState({}, '', '/?locale=zh-CN');
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByText(/zh-CN\|仪表盘\|/)).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('zh-CN');
  });

  it('substitutes interpolation values and picks the plural form from count', () => {
    window.history.replaceState({}, '', '/?locale=en');
    function InterpolationProbe() {
      const { t } = useLocale();
      return (
        <output>
          {t('applications.selectCompany', { company: 'Acme' })}|
          {t('applications.deleted', { count: 1 })}|{t('applications.deleted', { count: 3 })}
        </output>
      );
    }
    render(
      <LocaleProvider>
        <InterpolationProbe />
      </LocaleProvider>,
    );
    expect(
      screen.getByText('Select Acme|1 application deleted|3 applications deleted'),
    ).toBeInTheDocument();
  });
});

import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';

export const getIsAuthenticated = createServerFn({ method: 'GET' }).handler((): boolean => {
  return getCookie('jf_logged_in') !== undefined;
});

export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('jf_logged_in='));
}

export function clearAuthIndicator(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'jf_logged_in=; Max-Age=0; path=/';
}

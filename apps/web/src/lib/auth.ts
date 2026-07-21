import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { COOKIE_PATH, COOKIES } from '#/constants';

export const getIsAuthenticated = createServerFn({ method: 'GET' }).handler((): boolean => {
  return getCookie(COOKIES.LOGGED_IN) !== undefined;
});

export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${COOKIES.LOGGED_IN}=`));
}

export function clearAuthIndicator(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIES.LOGGED_IN}=; Max-Age=0; path=${COOKIE_PATH}`;
}

export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('jf_logged_in='));
}

export function clearAuthIndicator(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'jf_logged_in=; Max-Age=0; path=/';
}

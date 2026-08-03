import { toast } from 'sonner';

/**
 * Prompts for a refresh when a new service worker version takes over this
 * tab. sw.js calls skipWaiting()/clients.claim() so a new version activates
 * and takes over eagerly — but that only changes which worker handles
 * *future* network requests, not the JS already loaded and running here. An
 * already-open install (e.g. a backgrounded-not-killed home-screen PWA)
 * would otherwise keep running stale code indefinitely. Prompts instead of
 * reloading immediately, since a forced reload could lose in-progress form
 * input.
 *
 * The very first controllerchange for an uncontrolled page is the new
 * worker claiming it for the first time, not an update — only treated as
 * one once a controller was already active for this session. Returns a
 * cleanup function, or a no-op if service workers aren't supported.
 */
export function watchForServiceWorkerUpdate(): () => void {
  if (!('serviceWorker' in navigator)) return () => {};

  let hadController = Boolean(navigator.serviceWorker.controller);

  const handleControllerChange = () => {
    if (hadController) {
      toast('A new version of Job Finder is available.', {
        id: 'sw-update',
        duration: Infinity,
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload(),
        },
      });
    }
    hadController = true;
  };

  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
  return () =>
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
}

import { useEffect, useRef } from 'react';
import { useRouterState } from '@tanstack/react-router';
import NProgress from 'nprogress';

NProgress.configure({ showSpinner: false, minimum: 0.15, speed: 200 });

export function NavigationProgressBar() {
  const isLoading = useRouterState({ select: (s) => s.status === 'pending' });
  const prevIsLoading = useRef(isLoading);

  useEffect(() => {
    if (isLoading && !prevIsLoading.current) {
      NProgress.start();
    }
    if (!isLoading && prevIsLoading.current) {
      NProgress.done();
    }
    prevIsLoading.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    return () => {
      NProgress.done();
    };
  }, []);

  return null;
}

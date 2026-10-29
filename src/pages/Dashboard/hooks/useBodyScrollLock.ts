import { useEffect } from 'react';

/**
 * Stops the page behind the filter drawer scrolling while it's open.
 */
export function useBodyScrollLock (isLocked: boolean): void {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // Fixing the body also stops touch scrolling in mobile browsers, which ignore `overflow`.
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isLocked]);
}

import { useEffect } from 'react';

export function useBodyScrollLock (isLocked: boolean): void {
  useEffect(() => {
    if (isLocked) {
      // Prevent scroll on `body` and `html` elements.
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // Prevent touch scrolling on mobile.
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Restore scroll.
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Clean up on unmount.
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isLocked]);
}

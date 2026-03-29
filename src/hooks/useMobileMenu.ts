import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook for managing mobile menu state and side effects.
 * Handles escape key, body scroll prevention, and location-based closing.
 */
export function useMobileMenu () {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Close mobile menu when location changes.
   */
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  /**
   * Handle escape key and prevent body scroll when mobile menu is open.
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return {
    isMobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
  };
}

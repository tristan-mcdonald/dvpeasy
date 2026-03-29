import { Coins } from 'lucide-react';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface TokenLogoProps {
  tokenSymbol: string;
  logoUrl?: string;
  trustWalletLogoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * A lookup of `alias` → `base icon name` for wrapped/testnet tokens.
 * If the user asks for "weth" or "tusdc", we actually point at "eth.svg" or "usdc.svg".
 */
const SYMBOL_MAP: Record<string, string> = {
  // Wrapped/testnet variants → base symbols.
  taave: 'aave',
  tdai: 'dai',
  tlink: 'link',
  tuni: 'uni',
  tusd: 'usdt',
  tusdc: 'usdc',
  tusdt: 'usdt',
  twbtc: 'btc',
  tweth: 'eth',
  waave: 'aave',
  wbtc: 'btc',
  weth: 'eth',
  wuni: 'uni',
};

export const TokenLogo: FC<TokenLogoProps> = ({
  tokenSymbol,
  logoUrl,
  trustWalletLogoUrl,
  size = 'sm',
  className = '',
}) => {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const fallbackLevelRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'size-5',
    md: 'size-6',
    lg: 'size-8',
  };

  const normalized = tokenSymbol?.toLowerCase() || '';

  // If there's an alias (wrapped/testnet), point at its base symbol.
  const targetSymbol = normalized in SYMBOL_MAP ? SYMBOL_MAP[normalized] : normalized;
  const localIconUrl = targetSymbol ? `/icons/tokens/${targetSymbol}.svg` : null;

  // Memoize the fallback chain to prevent constant re-creation.
  const imageUrls = useMemo(() => [
    logoUrl,
    trustWalletLogoUrl,
    localIconUrl,
  ].filter(Boolean) as string[], [logoUrl, trustWalletLogoUrl, localIconUrl]);

  // Clear any existing timeout.
  const clearLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Try the next image URL in the fallback chain.
  const tryNextImage = useCallback(() => {
    const nextLevel = fallbackLevelRef.current + 1;
    if (nextLevel < imageUrls.length) {
      fallbackLevelRef.current = nextLevel;
      setCurrentImageUrl(imageUrls[nextLevel]);
      setImageState('loading');
    } else {
      // No more fallbacks available.
      setImageState('error');
      setCurrentImageUrl(null);
    }
  }, [imageUrls]);

  // Handle image load error - try next fallback.
  const handleImageError = useCallback(() => {
    clearLoadingTimeout();
    tryNextImage();
  }, [clearLoadingTimeout, tryNextImage]);

  // Handle successful image load.
  const handleImageLoad = useCallback(() => {
    clearLoadingTimeout();
    setImageState('loaded');
  }, [clearLoadingTimeout]);

  // Reset everything when the image URLs change.
  useEffect(() => {
    clearLoadingTimeout();
    fallbackLevelRef.current = 0;

    if (!normalized || imageUrls.length === 0) {
      setImageState('error');
      setCurrentImageUrl(null);
    } else {
      setCurrentImageUrl(imageUrls[0]);
      setImageState('loading');

      // Set timeout for first attempt.
      const timeoutId = setTimeout(() => {
        tryNextImage();
      }, 3000);

      timeoutRef.current = timeoutId;
    }

    // Cleanup timeout on unmount or dependency change.
    return () => clearLoadingTimeout();
  }, [normalized, imageUrls, clearLoadingTimeout, tryNextImage]);

  // Set up timeout when we're loading a specific image.
  useEffect(() => {
    if (imageState === 'loading' && currentImageUrl) {
      clearLoadingTimeout();

      const timeoutId = setTimeout(() => {
        tryNextImage();
      }, 3000);

      timeoutRef.current = timeoutId;

      return () => clearLoadingTimeout();
    }
  }, [currentImageUrl, imageState, clearLoadingTimeout, tryNextImage]);

  // If no symbol provided at all, immediately render fallback.
  if (!tokenSymbol) {
    return (
      <Coins className={`${sizeClasses[size]} ${className} text-text-label`} />
    );
  }

  // Show fallback icon for error or loading states without a current image.
  if (imageState === 'error' || (imageState === 'loading' && !currentImageUrl)) {
    return (
      <Coins className={`${sizeClasses[size]} ${className} text-text-label`} />
    );
  }

  // Show loading state with hidden image loading attempt.
  if (imageState === 'loading' && currentImageUrl) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <Coins className={`${sizeClasses[size]} text-text-label`} />

        {/* Hidden image for loading attempt. */}
        <img
        alt={`${tokenSymbol} logo`}
        className="absolute inset-0 opacity-0 pointer-events-none"
        onError={handleImageError}
        onLoad={handleImageLoad}
        src={currentImageUrl} />
      </div>
    );
  }

  // Show the actual image when successfully loaded.
  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <img
      alt={`${tokenSymbol} logo`}
      className={`${sizeClasses[size]} transition-opacity`}
      onError={handleImageError}
      src={currentImageUrl!} />
    </div>
  );
};

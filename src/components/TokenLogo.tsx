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
 * Test and wrapped tokens' symbols, by the symbol whose icon in `public/icons/tokens/` they share.
 */
const SYMBOL_MAP: Record<string, string> = {
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

/**
 * A token's logo from the first of its sources which loads: the token list's logo, Trust Wallet's,
 * then the app's own icon for its symbol. Until one loads, or if none does, a generic coin icon.
 */
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

  const targetSymbol = normalized in SYMBOL_MAP ? SYMBOL_MAP[normalized] : normalized;
  const localIconUrl = targetSymbol ? `/icons/tokens/${targetSymbol}.svg` : null;

  const imageUrls = useMemo(() => [
    logoUrl,
    trustWalletLogoUrl,
    localIconUrl,
  ].filter(Boolean) as string[], [logoUrl, trustWalletLogoUrl, localIconUrl]);

  const clearLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const tryNextImage = useCallback(() => {
    const nextLevel = fallbackLevelRef.current + 1;
    if (nextLevel < imageUrls.length) {
      fallbackLevelRef.current = nextLevel;
      setCurrentImageUrl(imageUrls[nextLevel]);
      setImageState('loading');
    } else {
      setImageState('error');
      setCurrentImageUrl(null);
    }
  }, [imageUrls]);

  const handleImageError = useCallback(() => {
    clearLoadingTimeout();
    tryNextImage();
  }, [clearLoadingTimeout, tryNextImage]);

  const handleImageLoad = useCallback(() => {
    clearLoadingTimeout();
    setImageState('loaded');
  }, [clearLoadingTimeout]);

  useEffect(() => {
    clearLoadingTimeout();
    fallbackLevelRef.current = 0;

    if (!normalized || imageUrls.length === 0) {
      setImageState('error');
      setCurrentImageUrl(null);
    } else {
      setCurrentImageUrl(imageUrls[0]);
      setImageState('loading');

      const timeoutId = setTimeout(() => {
        tryNextImage();
      }, 3000);

      timeoutRef.current = timeoutId;
    }

    return () => clearLoadingTimeout();
  }, [normalized, imageUrls, clearLoadingTimeout, tryNextImage]);

  // An image which neither loads nor fails within three seconds counts as failed.
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

  if (!tokenSymbol) {
    return (
      <Coins className={`${sizeClasses[size]} ${className} text-text-label`} />
    );
  }

  if (imageState === 'error' || (imageState === 'loading' && !currentImageUrl)) {
    return (
      <Coins className={`${sizeClasses[size]} ${className} text-text-label`} />
    );
  }

  // The image loads hidden behind the generic icon.
  if (imageState === 'loading' && currentImageUrl) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <Coins className={`${sizeClasses[size]} text-text-label`} />

        <img
        alt={`${tokenSymbol} logo`}
        className="absolute inset-0 opacity-0 pointer-events-none"
        onError={handleImageError}
        onLoad={handleImageLoad}
        src={currentImageUrl} />
      </div>
    );
  }

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

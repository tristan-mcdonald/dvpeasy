import { CustomTokenIcon } from './CustomTokenIcon';
import { getTokenSizeClasses, normalizeTokenSymbol, TokenSizeVariant } from '../utils/tokenSizeUtils';
import { memo, useCallback, useState } from 'react';
import { TokenLogo } from '../../TokenLogo';
import { TokenMetadata } from '../../../lib/token-api';

/**
 * Props for the TokenLogoResolver component.
 */
interface TokenLogoResolverProps {
  /** Token metadata containing address, symbol, and logo information */
  token: TokenMetadata;
  /** Size variant for the logo - defaults to 'sm' */
  size?: TokenSizeVariant;
  /** Whether this is a custom token (affects fallback behavior) */
  isCustomToken?: boolean;
}

/**
 * Image resolution states for the fallback system.
 */
type ImageState = 'oneinch' | 'trustwallet' | 'local' | 'custom' | 'fallback';

/**
 * TokenLogoResolver component with intelligent fallback system.
 *
 * Implements a multi-tier fallback strategy for token logos:
 * 1. 1inch API logoURI (highest priority - from token data source)
 * 2. TrustWallet CDN logo (fallback for tokens without 1inch logos)
 * 3. Local icon from public/icons/tokens/
 * 4. Custom token icon (for user-added tokens)
 *
 * Features:
 * - Automatic error handling and fallback progression
 * - Support for wrapped/testnet token symbol mapping
 * - Memoized for performance optimization
 * - Consistent sizing with other token components
 * - Prioritizes logos from same source as token data (1inch)
 *
 * @param props - Component props
 * @returns JSX element representing the resolved token logo
 *
 * @example
 * ```tsx
 * <TokenLogoResolver
 * token={tokenMetadata}
 * size="md"
 * isCustomToken={false} />
 * ```
 */
export const TokenLogoResolver = memo<TokenLogoResolverProps>(({
  token,
  size = 'sm',
  isCustomToken = false,
}) => {
  const [imageState, setImageState] = useState<ImageState>('oneinch');
  const { container } = getTokenSizeClasses(size);

  // Get normalized symbol for local icon lookup.
  const targetSymbol = normalizeTokenSymbol(token.symbol);
  const localIconUrl = targetSymbol ? `/icons/tokens/${targetSymbol}.svg` : null;

  // For ETH-related tokens, prioritize local icon to ensure consistency.
  const isEthRelated = targetSymbol === 'eth';
  const shouldPrioritizeLocal = isEthRelated && localIconUrl;

  // Handle 1inch image error -> try TrustWallet.
  const handleOneInchError = useCallback(() => {
    if (token.trustWalletLogoUrl) {
      setImageState('trustwallet');
    } else if (localIconUrl) {
      setImageState('local');
    } else {
      setImageState('custom');
    }
  }, [token.trustWalletLogoUrl, localIconUrl]);

  // Handle TrustWallet image error -> try local icon.
  const handleTrustWalletError = useCallback(() => {
    if (localIconUrl) {
      setImageState('local');
    } else {
      setImageState('custom');
    }
  }, [localIconUrl]);

  // Handle local icon error -> try custom icon.
  const handleLocalIconError = useCallback(() => {
    setImageState('custom');
  }, []);

  // Reset state when token changes.
  const tokenKey = `${token.address}-${token.symbol}`;
  const [lastTokenKey, setLastTokenKey] = useState(tokenKey);
  if (lastTokenKey !== tokenKey) {
    setLastTokenKey(tokenKey);
    setImageState('oneinch');
  }

  // If this is marked as a custom token, use the custom icon immediately.
  if (isCustomToken) {
    return <CustomTokenIcon size={size} />;
  }

  // For ETH-related tokens, prioritize local icon to ensure consistency.
  if (shouldPrioritizeLocal) {
    return (
      <img
      alt={token.symbol}
      className={`${container} rounded-full`}
      src={localIconUrl!} />
    );
  }

  // Render based on current state.
  if (imageState === 'custom') {
    return <CustomTokenIcon size={size} />;
  }

  if (imageState === 'fallback' || !token.symbol) {
    return (
      <TokenLogo
      size={size}
      tokenSymbol={token.symbol}
      trustWalletLogoUrl={token.trustWalletLogoUrl} />
    );
  }

  if (imageState === 'trustwallet' && token.trustWalletLogoUrl) {
    return (
      <img
      alt={token.symbol}
      className={`${container} rounded-full`}
      onError={handleTrustWalletError}
      src={token.trustWalletLogoUrl} />
    );
  }

  if (imageState === 'local' && localIconUrl) {
    return (
      <img
      alt={token.symbol}
      className={`${container} rounded-full`}
      onError={handleLocalIconError}
      src={localIconUrl} />
    );
  }

  // Default: try 1inch logo first.
  if (token.logoUrl) {
    return (
      <img
      alt={token.symbol}
      className={`${container} rounded-full`}
      onError={handleOneInchError}
      src={token.logoUrl} />
    );
  }

  // If no 1inch URL, try TrustWallet.
  if (token.trustWalletLogoUrl) {
    return (
      <img
      alt={token.symbol}
      className={`${container} rounded-full`}
      onError={handleTrustWalletError}
      src={token.trustWalletLogoUrl} />
    );
  }

  // If no API URLs, try local icon directly.
  if (localIconUrl) {
    return (
      <img
      alt={token.symbol}
      className={`${container} rounded-full`}
      onError={handleLocalIconError}
      src={localIconUrl} />
    );
  }

  // Final fallback to custom icon for tokens without any image sources.
  return <CustomTokenIcon size={size} />;
});

TokenLogoResolver.displayName = 'TokenLogoResolver';

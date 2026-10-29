import { CustomTokenIcon } from './CustomTokenIcon';
import { getTokenSizeClasses, normalizeTokenSymbol, TokenSizeVariant } from '../utils/tokenSizeUtils';
import { ListedToken } from '../../../types/tokens';
import { memo, useCallback, useState } from 'react';
import { TokenLogo } from '../../TokenLogo';

interface TokenLogoResolverProps {
  token: ListedToken;
  size?: TokenSizeVariant;
  isCustomToken?: boolean;
}

type ImageState = 'oneinch' | 'trustwallet' | 'local' | 'custom' | 'fallback';

/**
 * A token's logo, trying each source in turn as one fails to load: the token list's logo, Trust
 * Wallet's, then the app's own icon for its symbol, then a generic icon. Custom tokens always get
 * the generic icon, and ETH and wrapped ETH the app's own.
 */
export const TokenLogoResolver = memo<TokenLogoResolverProps>(({
  token,
  size = 'sm',
  isCustomToken = false,
}) => {
  const [imageState, setImageState] = useState<ImageState>('oneinch');
  const { container } = getTokenSizeClasses(size);

  const targetSymbol = normalizeTokenSymbol(token.symbol);
  const localIconUrl = targetSymbol ? `/icons/tokens/${targetSymbol}.svg` : null;

  const isEthRelated = targetSymbol === 'eth';
  const shouldPrioritizeLocal = isEthRelated && localIconUrl;

  const handleOneInchError = useCallback(() => {
    if (token.trustWalletLogoUrl) {
      setImageState('trustwallet');
    } else if (localIconUrl) {
      setImageState('local');
    } else {
      setImageState('custom');
    }
  }, [token.trustWalletLogoUrl, localIconUrl]);

  const handleTrustWalletError = useCallback(() => {
    if (localIconUrl) {
      setImageState('local');
    } else {
      setImageState('custom');
    }
  }, [localIconUrl]);

  const handleLocalIconError = useCallback(() => {
    setImageState('custom');
  }, []);

  // Starts from the first source again when the token changes.
  const tokenKey = `${token.address}-${token.symbol}`;
  const [lastTokenKey, setLastTokenKey] = useState(tokenKey);
  if (lastTokenKey !== tokenKey) {
    setLastTokenKey(tokenKey);
    setImageState('oneinch');
  }

  if (isCustomToken) {
    return <CustomTokenIcon size={size} />;
  }

  if (shouldPrioritizeLocal) {
    return (
      <img
      alt={token.symbol}
      className={`${container} rounded-full`}
      src={localIconUrl!} />
    );
  }

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

  if (token.logoUrl) {
    return (
      <img
      alt={token.symbol}
      className={`${container} rounded-full`}
      onError={handleOneInchError}
      src={token.logoUrl} />
    );
  }

  if (token.trustWalletLogoUrl) {
    return (
      <img
      alt={token.symbol}
      className={`${container} rounded-full`}
      onError={handleTrustWalletError}
      src={token.trustWalletLogoUrl} />
    );
  }

  if (localIconUrl) {
    return (
      <img
      alt={token.symbol}
      className={`${container} rounded-full`}
      onError={handleLocalIconError}
      src={localIconUrl} />
    );
  }

  return <CustomTokenIcon size={size} />;
});

TokenLogoResolver.displayName = 'TokenLogoResolver';

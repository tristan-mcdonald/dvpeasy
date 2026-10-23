import { AssetType } from '../lib/token-metadata';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useMemo } from 'react';
import { useTokenData } from './useTokenData';
import { useTokensMetadata } from './useTokenMetadata';

export interface TokenForDisplay {
  symbol: string;
  name: string;
  isNFT: boolean;
  isLoading: boolean;
  logoUrl?: string;
  trustWalletLogoUrl?: string;
}

/**
 * What to show for each of several tokens, by address in lower case: the token list's symbol,
 * name and logos where it lists the token, and otherwise the contract's symbol.
 */
export function useTokensForDisplay (tokenAddresses: string[]): Record<string, TokenForDisplay> {
  const { chainId } = useCurrentNetwork().network;
  const tokensMetadata = useTokensMetadata(tokenAddresses);
  const { tokens: listedTokens, isLoading: isLoadingList } = useTokenData(chainId, Infinity);

  return useMemo(() => {
    const listedTokensByAddress = new Map(
      listedTokens.map(listedToken => [listedToken.address.toLowerCase(), listedToken]),
    );

    return Object.fromEntries(Object.entries(tokensMetadata).map(([address, { metadata, isLoading }]) => {
      const listedToken = listedTokensByAddress.get(address);
      const symbol = listedToken?.symbol ?? metadata?.symbol ?? 'TOKEN';
      return [address, {
        symbol,
        name: listedToken?.name || symbol,
        isNFT: metadata?.assetType === AssetType.ERC721,
        isLoading: isLoading || isLoadingList,
        logoUrl: listedToken?.logoUrl,
        trustWalletLogoUrl: listedToken?.trustWalletLogoUrl,
      }];
    }));
  }, [tokensMetadata, listedTokens, isLoadingList]);
}

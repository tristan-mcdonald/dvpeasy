import { isAddress } from 'viem';
import { ListedToken } from '../../../types/tokens';
import { tokenStorage } from '../../../lib/custom-token-storage';
import { useCurrentNetwork } from '../../../hooks/useCurrentNetwork';
import { useEffect } from 'react';
import { useTokenMetadata } from '../../../hooks/useTokenMetadata';

interface UseSaveCustomTokenOptions {
  address: string;
  listedTokens: ListedToken[];
  isLoadingList: boolean;
}

/**
 * Saves a token entered in the selector which isn't in the list as a custom token, once its own
 * details have been read, so that only real tokens are saved, each under its own symbol.
 */
export function useSaveCustomToken ({ address, listedTokens, isLoadingList }: UseSaveCustomTokenOptions) {
  const { chainId } = useCurrentNetwork().network;
  const isListed = listedTokens.some(listedToken =>
    listedToken.address.toLowerCase() === address.toLowerCase(),
  );
  const isUnlistedAddress = isAddress(address) && !isLoadingList && !isListed;
  const { data: metadata } = useTokenMetadata(address, { isEnabled: isUnlistedAddress });

  useEffect(() => {
    if (!isUnlistedAddress || !metadata?.symbol) return;
    tokenStorage.addCustomTokenForChain({
      address,
      symbol: metadata.symbol,
      name: metadata.name || metadata.symbol,
      chainId,
    }, chainId);
  }, [address, isUnlistedAddress, metadata, chainId]);
}

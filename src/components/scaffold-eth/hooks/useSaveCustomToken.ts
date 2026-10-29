import { AssetType } from '../../../lib/token-metadata';
import { isAddress } from 'viem';
import { ListedToken } from '../../../types/tokens';
import { tokenStorage } from '../../../lib/custom-token-storage';
import { useCurrentNetwork } from '../../../hooks/useCurrentNetwork';
import { useEffect } from 'react';

interface UseSaveCustomTokenOptions {
  address: string;
  symbol: string;
  assetType: AssetType | null;
  listedTokens: ListedToken[];
  isLoadingList: boolean;
}

/**
 * Saves a token entered in the selector which isn't in the list as a custom token, once its own
 * details have been read, so that only real tokens are saved, each under its own symbol.
 */
export function useSaveCustomToken ({
  address,
  symbol,
  assetType,
  listedTokens,
  isLoadingList,
}: UseSaveCustomTokenOptions) {
  const { chainId } = useCurrentNetwork().network;

  useEffect(() => {
    if (!isAddress(address) || !assetType || !symbol || isLoadingList) return;

    const isListed = listedTokens.some(listedToken =>
      listedToken.address.toLowerCase() === address.toLowerCase(),
    );
    if (isListed) return;

    tokenStorage.addCustomTokenForChain({ address, symbol, name: symbol, chainId }, chainId);
  }, [address, symbol, assetType, listedTokens, isLoadingList, chainId]);
}

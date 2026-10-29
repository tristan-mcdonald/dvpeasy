import { Address, erc721Abi, isAddress, zeroAddress } from 'viem';
import { AssetType } from '../../../lib/token-metadata';
import { useBalance, useReadContract } from 'wagmi';
import { useCurrentNetwork } from '../../../hooks/useCurrentNetwork';
import { useTokenMetadata } from '../../../hooks/useTokenMetadata';

interface UseTokenBalanceProps {
  address: string;
  balanceAddress?: string;
  storedTokenData?: { address: string; symbol?: string; name?: string; chainId?: number } | null;
}

interface UseTokenBalanceReturn {
  tokenSymbol: string;
  isLoadingSymbol: boolean;
  assetType: AssetType | null;
  nftBalance: bigint | null;
  isLoadingNftBalance: boolean;
  userBalance: { formatted: string; symbol?: string } | undefined;
  isLoadingBalance: boolean;
}

/**
 * The chosen token's symbol and type, and an address's balance of it: a count for an ERC-721, or
 * wagmi's balance for an ERC-20 or ETH.
 */
export const useTokenBalance = ({
  address,
  balanceAddress,
  storedTokenData,
}: UseTokenBalanceProps): UseTokenBalanceReturn => {
  const { chainId } = useCurrentNetwork().network;
  const isTokenAddress = isAddress(address);

  // A token picked from the dropdown already has its symbol, and is taken to be an ERC-20.
  const storedSymbol = storedTokenData?.address.toLowerCase() === address.toLowerCase()
    ? storedTokenData.symbol
    : undefined;
  const tokenMetadataQuery = useTokenMetadata(address, { isEnabled: !storedSymbol });
  const metadata = tokenMetadataQuery.data;

  const assetType = storedSymbol ? AssetType.ERC20 : metadata?.assetType ?? null;
  const tokenSymbol = storedSymbol || metadata?.symbol || (tokenMetadataQuery.isError ? 'TOKEN' : '');

  const { data: userBalance, isLoading: isLoadingBalance } = useBalance({
    address: balanceAddress as Address | undefined,
    chainId,
    token: isTokenAddress && address !== zeroAddress ? address : undefined,
    query: {
      enabled: !!balanceAddress && isTokenAddress && assetType !== AssetType.ERC721,
    },
  });

  const nftBalanceQuery = useReadContract({
    address: isTokenAddress ? address : undefined,
    abi: erc721Abi,
    functionName: 'balanceOf',
    args: balanceAddress ? [balanceAddress as Address] : undefined,
    chainId,
    query: {
      enabled: !!balanceAddress && isTokenAddress && assetType === AssetType.ERC721,
    },
  });

  return {
    tokenSymbol,
    isLoadingSymbol: !storedSymbol && tokenMetadataQuery.isLoading,
    assetType,
    nftBalance: assetType === AssetType.ERC721 ? nftBalanceQuery.data ?? null : null,
    isLoadingNftBalance: nftBalanceQuery.isLoading,
    userBalance,
    isLoadingBalance,
  };
};

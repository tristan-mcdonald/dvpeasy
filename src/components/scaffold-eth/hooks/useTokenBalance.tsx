import { Address, erc721Abi, isAddress, zeroAddress } from 'viem';
import { AssetType } from '../../../lib/token-metadata';
import { useBalance, useReadContract } from 'wagmi';
import { useCurrentNetwork } from '../../../hooks/useCurrentNetwork';
import { useTokenMetadata } from '../../../hooks/useTokenMetadata';

/**
 * Props for the useTokenBalance hook.
 */
interface UseTokenBalanceProps {
  /** The token address to get balance for */
  address: string;
  /** The wallet address to check balance for */
  balanceAddress?: string;
  /** Stored token data from dropdown selection (used as fallback) */
  storedTokenData?: { address: string; symbol?: string; name?: string; chainId?: number } | null;
}

/**
 * Return type for the useTokenBalance hook.
 */
interface UseTokenBalanceReturn {
  /** Token symbol */
  tokenSymbol: string;
  /** Whether token symbol is loading */
  isLoadingSymbol: boolean;
  /** Detected asset type */
  assetType: AssetType | null;
  /** NFT balance for ERC721 tokens */
  nftBalance: bigint | null;
  /** Whether NFT balance is loading */
  isLoadingNftBalance: boolean;
  /** ERC20/ETH balance data from wagmi */
  userBalance: { formatted: string; symbol?: string } | undefined;
  /** Whether ERC20/ETH balance is loading */
  isLoadingBalance: boolean;
}

/**
 * Custom hook for managing token balance fetching and asset type detection.
 *
 * Provides:
 * - Token symbol and asset type detection
 * - ERC20/ETH balance fetching via wagmi
 * - ERC721 NFT balance fetching
 * - Loading states for all operations
 * - Error handling with fallback states
 *
 * @param props - Hook configuration
 * @returns Object containing balance data and loading states
 *
 * @example
 * ```tsx
 * const {
 *   tokenSymbol,
 *   assetType,
 *   userBalance,
 *   isLoadingBalance
 * } = useTokenBalance({
 *   address: "0x123…",
 *   balanceAddress: "0x456…"
 * });
 * ```
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
  const tokenMetadataQuery = useTokenMetadata(address);
  const metadata = tokenMetadataQuery.data;

  let tokenSymbol = '';
  let assetType: AssetType | null = null;
  if (storedSymbol) {
    tokenSymbol = storedSymbol;
    assetType = AssetType.ERC20;
  } else if (metadata) {
    tokenSymbol = metadata.symbol;
    assetType = metadata.assetType;
  } else if (tokenMetadataQuery.isError) {
    tokenSymbol = 'TOKEN';
  }

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

import { AssetType, tokenManager } from '../../../lib/token-manager';
import { isAddress } from 'viem';
import { logger } from '../../../lib/logger';
import { useBalance } from 'wagmi';
import { useEffect, useState } from 'react';

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
  const normalizedAddress = address;

  // Token metadata state.
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [isLoadingSymbol, setIsLoadingSymbol] = useState(false);
  const [assetType, setAssetType] = useState<AssetType | null>(null);

  // NFT balance state.
  const [nftBalance, setNftBalance] = useState<bigint | null>(null);
  const [isLoadingNftBalance, setIsLoadingNftBalance] = useState(false);

  /**
   * Get user's ERC20/ETH balance using wagmi.
   * Only enabled for ERC20 tokens and ETH, not for NFTs.
   */
  const { data: userBalance, isLoading: isLoadingBalance } = useBalance({
    address: balanceAddress as `0x${string}` | undefined,
    token: normalizedAddress && normalizedAddress !== '0x0000000000000000000000000000000000000000'
      ? normalizedAddress as `0x${string}`
      : undefined,
    query: {
      enabled: !!balanceAddress &&
               !!normalizedAddress &&
               isAddress(normalizedAddress) &&
               assetType !== AssetType.ERC721,
    },
  });

  /**
   * Fetch token symbol and detect asset type.
   * Runs when the normalized address changes.
   * Only attempts token detection for valid Ethereum addresses.
   */
  useEffect(() => {
    const fetchTokenSymbol = async () => {
      // Only proceed if we have a valid Ethereum address
      if (normalizedAddress && isAddress(normalizedAddress)) {
        // Check if we have stored token data for this address.
        const hasStoredData = storedTokenData &&
          storedTokenData.address.toLowerCase() === normalizedAddress.toLowerCase() &&
          storedTokenData.symbol;

        // If we have stored data, use it immediately and skip API calls.
        if (hasStoredData) {
          setTokenSymbol(storedTokenData.symbol!);
          setAssetType(AssetType.ERC20); // Assume ERC20 for dropdown selections.
          setIsLoadingSymbol(false);
          return;
        }

        setIsLoadingSymbol(true);
        try {
          const detectedAssetType = await tokenManager.detectAssetType(normalizedAddress);
          setAssetType(detectedAssetType);

          if (detectedAssetType === AssetType.ETH) {
            setTokenSymbol('ETH');
          } else {
            // For both ERC20 and ERC721, try to get the symbol.
            const symbol = await tokenManager.tokenSymbol(normalizedAddress);
            setTokenSymbol(symbol);
          }
        } catch (error) {
          logger.warn('Failed to fetch token symbol:', error);

          // Use stored token data as fallback if available.
          if (storedTokenData &&
              storedTokenData.address.toLowerCase() === normalizedAddress.toLowerCase() &&
              storedTokenData.symbol) {
            setTokenSymbol(storedTokenData.symbol);
            setAssetType(AssetType.ERC20);
          } else {
            setTokenSymbol('TOKEN');
            setAssetType(null);
          }
        }
        setIsLoadingSymbol(false);
      } else {
        // Reset state for invalid or empty addresses.
        // Don't show loading or attempt validation for non-address inputs.
        setTokenSymbol('');
        setAssetType(null);
        setIsLoadingSymbol(false);
      }
    };

    fetchTokenSymbol();
  }, [normalizedAddress, storedTokenData]);

  /**
   * Fetch NFT balance for ERC721 tokens.
   * Only runs when we have a valid ERC721 token and balance address.
   */
  useEffect(() => {
    const fetchNFTBalance = async () => {
      if (balanceAddress && isAddress(normalizedAddress) && assetType === AssetType.ERC721) {
        setIsLoadingNftBalance(true);
        try {
          const balance = await tokenManager.nftBalance(normalizedAddress, balanceAddress);
          setNftBalance(balance);
        } catch (error) {
          logger.warn('Failed to fetch NFT balance:', error);
          setNftBalance(null);
        }
        setIsLoadingNftBalance(false);
      } else {
        // Reset NFT balance for non-ERC721 tokens.
        setNftBalance(null);
        setIsLoadingNftBalance(false);
      }
    };

    fetchNFTBalance();
  }, [balanceAddress, normalizedAddress, assetType]);

  return {
    tokenSymbol,
    isLoadingSymbol,
    assetType,
    nftBalance,
    isLoadingNftBalance,
    userBalance,
    isLoadingBalance,
  };
};

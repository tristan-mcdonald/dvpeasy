import { isAddress } from 'viem';
import { logger } from '../../../lib/logger';
import { useEffect, useState } from 'react';
import { tokenManager } from '../../../lib/token-manager';
import { useCurrentNetwork } from '../../../hooks/useCurrentNetwork';

/**
 * Hook to fetch token symbol for a given token address.
 *
 * @param tokenAddress - The token address to fetch symbol for.
 * @returns Object containing the token symbol, loading state, and error state.
 */
export function useTokenSymbol (tokenAddress: string) {
  const networkDeployment = useCurrentNetwork();
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenSymbol = async () => {
      // Reset state when token address changes.
      setTokenSymbol('');
      setError(null);

      // Only proceed if we have a valid Ethereum address.
      if (!tokenAddress || !isAddress(tokenAddress)) {
        return;
      }

      setIsLoading(true);

      try {
        const symbol = await tokenManager.tokenSymbol(tokenAddress, networkDeployment);
        setTokenSymbol(symbol);
      } catch (error) {
        logger.warn('Failed to fetch token symbol:', error);
        setError('Failed to fetch token symbol');
        // Fallback to generic "Token" if we can't fetch the symbol.
        setTokenSymbol('Token');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenSymbol();
  }, [tokenAddress, networkDeployment]);

  return {
    tokenSymbol,
    isLoading,
    error,
  };
}

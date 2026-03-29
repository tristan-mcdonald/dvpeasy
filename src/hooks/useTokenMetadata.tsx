import { logger } from '../lib/logger';
import { tokenManager } from '../lib/token-manager';
import { useChainId } from 'wagmi';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useTokenData } from './useTokenData';

interface TokenMetadata {
  symbol: string;
  isLoading: boolean;
  isNFT: boolean;
  trustWalletLogoUrl?: string;
  logoUrl?: string;
}

export function useTokenMetadata (flows: Array<{ token: string }> = []) {
  const chainId = useChainId();
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

  // Create a stable string key from flows to avoid unnecessary recalculations.
  const flowsKey = useMemo(() => {
    if (!flows || flows.length === 0) return '';
    return flows.map(flow => flow.token.toLowerCase()).sort().join(',');
  }, [flows]);

  // Fetch rich token data including logo URLs.
  const { tokens: availableTokens, isLoading: isLoadingTokenData } = useTokenData(chainId);

  // Create a stable key for token data to detect actual changes.
  const tokenDataKey = useMemo(() => {
    if (!availableTokens || availableTokens.length === 0) return 'empty';
    return `${availableTokens.length}-${chainId}`;
  }, [availableTokens, chainId]);

  // Use refs to track processing state and avoid dependency loops.
  const lastProcessedAddresses = useRef<string>('');
  const lastProcessedTokenDataKey = useRef<string>('');
  const availableTokensRef = useRef(availableTokens);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestCache = useRef<Map<string, Promise<TokenMetadata>>>(new Map());

  // Keep availableTokensRef up to date.
  availableTokensRef.current = availableTokens;

  useEffect(() => {

    // Abort any previous async operation.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Use the flowsKey directly instead of uniqueAddresses array.
    const addressesKey = flowsKey;

    // Don't process if token data is still loading.
    if (isLoadingTokenData) {
      return;
    }

    // Handle empty addresses case.
    if (!flowsKey) {
      setTokenMetadata({});
      lastProcessedAddresses.current = '';
      lastProcessedTokenDataKey.current = tokenDataKey;
      return;
    }

    // Check if we should skip processing based on addresses and token data.
    const tokenDataChanged = lastProcessedTokenDataKey.current !== tokenDataKey;
    if (lastProcessedAddresses.current === addressesKey && !tokenDataChanged) {
      return;
    }

    // Create new abort controller for this operation.
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchTokenMetadata = async () => {
      try {
        // Check if aborted before starting.
        if (abortController.signal.aborted) {
          return;
        }

        // Get addresses from the key.
        const addresses = addressesKey.split(',').filter(addr => addr.length > 0);

        // Create token lookup map for this execution.
        const tokenLookupMap = new Map();
        if (availableTokensRef.current) {
          availableTokensRef.current.forEach(token => {
            tokenLookupMap.set(token.address.toLowerCase(), token);
          });
        }

        // Initialize tokens with loading state.
        const initialMetadata: Record<string, TokenMetadata> = {};
        addresses.forEach(address => {
          initialMetadata[address] = {
            symbol: '',
            isLoading: true,
            isNFT: false,
          };
        });

        setTokenMetadata(initialMetadata);

        // Check if aborted after setting initial state.
        if (abortController.signal.aborted) {
          return;
        }

        // Fetch metadata for each token with improved deduplication.
        const updatedMetadata: Record<string, TokenMetadata> = {};
        await Promise.all(
          addresses.map(async (address) => {
            try {
              // Check if aborted before each token.
              if (abortController.signal.aborted) {
                return;
              }

              // Check if we already have a pending request for this token.
              const cacheKey = `${chainId}-${address}`;
              let tokenMetadataPromise = requestCache.current.get(cacheKey);

              if (!tokenMetadataPromise) {
                // Create new request and cache it.
                tokenMetadataPromise = (async (): Promise<TokenMetadata> => {
                  // First try to find token in the rich token data.
                  const richTokenData = tokenLookupMap.get(address);

                  if (richTokenData) {
                    // Use rich data if available.
                    return {
                      symbol: richTokenData.symbol,
                      isLoading: false,
                      isNFT: false, // Rich token data is primarily for ERC20s.
                      trustWalletLogoUrl: richTokenData.trustWalletLogoUrl,
                      logoUrl: richTokenData.logoUrl,
                    };
                  } else {
                    // Fall back to contract metadata.
                    const metadata = await tokenManager.tokenMetadata(address);
                    return {
                      symbol: metadata.symbol,
                      isLoading: false,
                      isNFT: metadata.isNFT || false,
                    };
                  }
                })();

                requestCache.current.set(cacheKey, tokenMetadataPromise);

                // Clean up cache entry after a delay to prevent memory leaks.
                setTimeout(() => {
                  requestCache.current.delete(cacheKey);
                }, 30000); // 30 seconds.
              }

              const tokenMetadata = await tokenMetadataPromise;
              updatedMetadata[address] = tokenMetadata;
            } catch (error) {
              if (abortController.signal.aborted) {
                return;
              }
              logger.warn(`Failed to get metadata for token ${address}:`, error);
              updatedMetadata[address] = {
                symbol: 'TOKEN',
                isLoading: false,
                isNFT: false,
              };
            }
          }),
        );

        // Final check before setting state.
        if (!abortController.signal.aborted) {
          setTokenMetadata(updatedMetadata);
          lastProcessedAddresses.current = addressesKey;
          lastProcessedTokenDataKey.current = tokenDataKey;
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          logger.warn('Error fetching token metadata:', error);
        }
      }
    };

    fetchTokenMetadata();

    // Cleanup function.
    return () => {
      abortController.abort();
    };
  }, [flowsKey, isLoadingTokenData, chainId, tokenDataKey]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return tokenMetadata;
}

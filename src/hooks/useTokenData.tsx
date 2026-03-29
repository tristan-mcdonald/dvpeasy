import { chainManager } from '../lib/chain-manager';
import { logger } from '../lib/logger';
import { sepoliaTokens } from '../data/testnet-tokens/sepolia';
import { TokenMetadata } from '../lib/token-api';
import { tokenStorage } from '../lib/custom-token-storage';
import { useDebounce } from 'use-debounce';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Unified token data hook that consolidates all token fetching logic.
 *
 * This hook replaces the separate `fetchAvailableTokens` and `fetchTokenListForSearch` functions to
 * eliminate duplicate 1Inch API calls. It provides both dropdown tokens and search functionality
 * from a single data source.
 *
 * Features:
 * - Single 1Inch API call per chain with smart caching
 * - Client-side search with relevance scoring
 * - Network-aware token filtering
 * - Custom token integration
 * - Graceful fallback for testnets
 *
 * @example
 * ```tsx
 * const { tokens, searchTokens, isLoading, error } = useTokenData(chainId);
 * const searchResults = searchTokens('USDC', { limit: 20 });
 * ```
 */

/**
 * Search options for token filtering.
 */
export interface TokenSearchOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Include custom tokens in results */
  includeCustomTokens?: boolean;
}

/**
 * Search result with relevance scoring.
 */
export interface TokenSearchResult {
  /** Matching tokens */
  tokens: TokenMetadata[];
  /** Search query used */
  query: string;
  /** Total results found */
  totalResults: number;
  /** Result counts by source */
  counts: {
    api: number;
    custom: number;
  };
}

/**
 * Testnet token database interface.
 */
interface TestnetTokenDatabase {
  readonly chainId: number;
  readonly chainName: string;
  readonly faucetUrl: string;
  readonly tokens: ReadonlyArray<{
    readonly address: string;
    readonly symbol: string;
    readonly name: string;
    readonly decimals: number;
  }>;
}

/**
 * Load testnet tokens from TypeScript files based on chain ID.
 */
function loadTestnetTokens (chainId: number): TestnetTokenDatabase | null {
  switch (chainId) {
    case 11155111: // Sepolia.
      return sepoliaTokens;
    default:
      return null;
  }
}

/**
 * Get testnet-specific tokens for fallback purposes.
 */
function getTestnetTokens (chainId: number): TokenMetadata[] {
  try {
    const testnetData = loadTestnetTokens(chainId);

    if (!testnetData) {
      // Fallback to basic ETH token if no data found.
      return [{
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        chainId,
        decimals: 18,
        trustWalletLogoUrl: chainManager.trustWalletLogoUrl(chainId, '0x0000000000000000000000000000000000000000'),
        lastUpdated: Date.now(),
      }];
    }

    return testnetData.tokens.map((token) => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      chainId,
      decimals: token.decimals,
      trustWalletLogoUrl: chainManager.trustWalletLogoUrl(chainId, token.address),
      lastUpdated: Date.now(),
    }));
  } catch (error) {
    logger.warn(`Failed to load testnet tokens for chain ${chainId}:`, error);
    // Fallback to basic ETH token.
    return [{
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      chainId,
      decimals: 18,
      trustWalletLogoUrl: chainManager.trustWalletLogoUrl(chainId, '0x0000000000000000000000000000000000000000'),
      lastUpdated: Date.now(),
    }];
  }
}

/**
 * Fetch tokens from 1Inch API for mainnet networks.
 */
async function fetchMainnetTokens (chainId: number): Promise<TokenMetadata[]> {
  const networkConfig = chainManager.chainConfig(chainId)!;

  try {
    const apiKey = import.meta.env.VITE_API_KEY_ONEINCH;
    if (!apiKey) {
      logger.warn('VITE_API_KEY_ONEINCH not configured, falling back to native token');
      return [{
        address: networkConfig.nativeToken.address,
        symbol: networkConfig.nativeToken.symbol,
        name: networkConfig.nativeToken.name,
        chainId,
        decimals: networkConfig.nativeToken.decimals,
        trustWalletLogoUrl: chainManager.trustWalletLogoUrl(chainId, networkConfig.nativeToken.address),
        logoUrl: chainManager.trustWalletLogoUrl(chainId, networkConfig.nativeToken.address),
        lastUpdated: Date.now(),
      }];
    }

    const response = await fetch(`/api/1inch/v1.1/${chainId}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout.
    });

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.status} ${response.statusText}`);
    }

    const tokensData = await response.json();
    return transformTokensData(tokensData, chainId);
  } catch (error) {
    logger.warn(`Failed to fetch from 1inch API: ${error instanceof Error ? error.message : error}`);
    return [{
      address: networkConfig.nativeToken.address,
      symbol: networkConfig.nativeToken.symbol,
      name: networkConfig.nativeToken.name,
      chainId,
      decimals: networkConfig.nativeToken.decimals,
      trustWalletLogoUrl: chainManager.trustWalletLogoUrl(chainId, networkConfig.nativeToken.address),
      logoUrl: chainManager.trustWalletLogoUrl(chainId, networkConfig.nativeToken.address),
      lastUpdated: Date.now(),
    }];
  }
}

/**
 * Transform 1Inch API response data into TokenMetadata array.
 */
function transformTokensData (tokensData: Record<string, unknown>, chainId: number): TokenMetadata[] {
  const networkConfig = chainManager.chainConfig(chainId)!;
  const tokens: TokenMetadata[] = [];

  // First, add native token.
  tokens.push({
    address: networkConfig.nativeToken.address,
    symbol: networkConfig.nativeToken.symbol,
    name: networkConfig.nativeToken.name,
    chainId,
    decimals: networkConfig.nativeToken.decimals,
    trustWalletLogoUrl: chainManager.trustWalletLogoUrl(chainId, networkConfig.nativeToken.address),
    logoUrl: chainManager.trustWalletLogoUrl(chainId, networkConfig.nativeToken.address),
    lastUpdated: Date.now(),
  });

  // Transform 1Inch tokens and filter out native token duplicates.
  const transformedTokens = Object.values(tokensData)
    .filter((token: unknown) => {
      const tokenData = token as Record<string, unknown>;
      return (tokenData.address as string).toLowerCase() !== networkConfig.nativeToken.address.toLowerCase();
    })
    .map((token: unknown) => {
      const tokenData = token as Record<string, unknown>;
      return {
        address: tokenData.address as string,
        symbol: (tokenData.displayedSymbol || tokenData.symbol) as string,
        name: tokenData.name as string,
        chainId,
        decimals: (tokenData.decimals as number) || 18,
        logoUrl: tokenData.logoURI as string,
        trustWalletLogoUrl: chainManager.trustWalletLogoUrl(chainId, tokenData.address as string),
        lastUpdated: Date.now(),
      };
    });

  tokens.push(...transformedTokens);
  return tokens;
}

/**
 * Calculate relevance score for search result ranking. Higher scores appear first in results.
 */
function calculateRelevanceScore (token: TokenMetadata, query: string): number {
  const normalizedQuery = query.toLowerCase().trim();
  const symbol = token.symbol.toLowerCase();
  const name = token.name.toLowerCase();
  const address = token.address.toLowerCase();

  let score = 0;

  // Exact symbol match gets highest score.
  if (symbol === normalizedQuery) score += 100;

  // Symbol starts with query gets high score.
  else if (symbol.startsWith(normalizedQuery)) score += 80;

  // Symbol contains query gets medium score.
  else if (symbol.includes(normalizedQuery)) score += 60;

  // Exact name match gets high score.
  else if (name === normalizedQuery) score += 70;

  // Name starts with query gets medium score.
  else if (name.startsWith(normalizedQuery)) score += 50;

  // Name contains query gets lower score.
  else if (name.includes(normalizedQuery)) score += 30;

  // Address match gets lowest score.
  else if (address.includes(normalizedQuery)) score += 10;

  return score;
}

/**
 * Merge and rank tokens from different sources with relevance scoring.
 */
function mergeAndRankTokens (
  apiTokens: TokenMetadata[],
  customTokens: TokenMetadata[],
  query: string,
  maxResults: number,
): { tokens: TokenMetadata[]; counts: TokenSearchResult['counts'] } {
  const tokenMap = new Map<string, TokenMetadata & { relevanceScore: number; source: string }>();
  const counts = { api: 0, custom: 0 };

  // Add custom tokens first.
  customTokens.forEach(token => {
    const key = `${token.address.toLowerCase()}-${token.chainId}`;
    const relevanceScore = calculateRelevanceScore(token, query);
    if (relevanceScore > 0) {
      tokenMap.set(key, { ...token, relevanceScore, source: 'custom' });
      counts.custom++;
    }
  });

  // Add API tokens (highest priority, will override custom tokens with same address).
  apiTokens.forEach(token => {
    const key = `${token.address.toLowerCase()}-${token.chainId}`;
    const relevanceScore = calculateRelevanceScore(token, query);
    if (relevanceScore > 0) {
      const existing = tokenMap.get(key);
      tokenMap.set(key, { ...token, relevanceScore, source: 'api' });
      if (!existing) counts.api++;
    }
  });

  // Convert to array, sort by relevance, and limit results.
  const tokens = Array.from(tokenMap.values())
    .sort((a, b) => {
      // First sort by relevance score.
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Then by name.
      return a.name.localeCompare(b.name);
    })
    .slice(0, maxResults)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ relevanceScore: _relevanceScore, source: _source, ...token }) => token); // Remove scoring fields.

  return { tokens, counts };
}

/**
 * Unified hook for fetching and searching tokens.
 * Eliminates duplicate API calls by providing both dropdown and search from single source.
 */
export function useTokenData (chainId: number, limit: number = 100) {
  // Fetch all tokens for the chain.
  const {
    data: allTokens,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['unified-token-data', chainId],
    queryFn: async (): Promise<TokenMetadata[]> => {
      const networkConfig = chainManager.chainConfig(chainId);

      if (!networkConfig) {
        throw new Error(`Unsupported network: ${chainId}`);
      }

      // Handle testnets.
      if (networkConfig.isTestnet) {
        return getTestnetTokens(chainId);
      }

      // Handle mainnets with 1Inch API.
      return await fetchMainnetTokens(chainId);
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes.
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection.
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  // Get custom tokens for the current chain.
  const customTokens = useMemo(() => {
    const stored = tokenStorage.getCustomTokensForChain(chainId);
    return stored.map(token => ({
      ...token,
      chainId: token.chainId || chainId,
    })) as TokenMetadata[];
  }, [chainId]);

  // Combine API tokens with custom tokens for dropdown.
  const tokens = useMemo(() => {
    if (!allTokens) return [];

    const combined = [...allTokens];

    // Add custom tokens that aren't already in the API results.
    customTokens.forEach(customToken => {
      const existsInApi = allTokens.some(apiToken =>
        apiToken.address.toLowerCase() === customToken.address.toLowerCase(),
      );
      if (!existsInApi) {
        combined.push(customToken);
      }
    });

    return combined.slice(0, limit);
  }, [allTokens, customTokens, limit]);

  // Client-side search function.
  const searchTokens = useMemo(() => {
    return (query: string, options: TokenSearchOptions = {}): TokenSearchResult => {
      const { limit: searchLimit = 50, includeCustomTokens = true } = options;
      const trimmedQuery = query.trim();

      if (!trimmedQuery || !allTokens) {
        return {
          tokens: [],
          query: trimmedQuery,
          totalResults: 0,
          counts: { api: 0, custom: 0 },
        };
      }

      const searchCustomTokens = includeCustomTokens ? customTokens : [];
      const { tokens: searchResults, counts } = mergeAndRankTokens(
        allTokens,
        searchCustomTokens,
        trimmedQuery,
        searchLimit,
      );

      return {
        tokens: searchResults,
        query: trimmedQuery,
        totalResults: searchResults.length,
        counts,
      };
    };
  }, [allTokens, customTokens]);

  return {
    /** All available tokens for dropdown */
    tokens: tokens || [],
    /** Client-side search function */
    searchTokens,
    /** Loading state */
    isLoading,
    /** Error state */
    error,
    /** Refetch function */
    refetch,
    /** Custom tokens for current chain */
    customTokens,
  };
}

/**
 * Hook for debounced token search using the unified data source.
 */
export function useTokenSearch (
  query: string,
  chainId: number,
  options: {
    enabled?: boolean;
    debounceDelay?: number;
    maxResults?: number;
    includeCustomTokens?: boolean;
  } = {},
) {
  const {
    enabled = true,
    debounceDelay = 300,
    maxResults = 20,
    includeCustomTokens = true,
  } = options;

  // Debounce the query.
  const [debouncedQuery] = useDebounce(query.trim(), debounceDelay);

  // Get the unified token data.
  const { searchTokens, isLoading: isLoadingTokens, error } = useTokenData(chainId);

  // Perform search with debounced query.
  const searchResult = useMemo(() => {
    if (!enabled || !debouncedQuery || debouncedQuery.length < 1) {
      return {
        tokens: [],
        query: debouncedQuery,
        totalResults: 0,
        counts: { api: 0, custom: 0 },
      };
    }

    return searchTokens(debouncedQuery, {
      limit: maxResults,
      includeCustomTokens,
    });
  }, [searchTokens, debouncedQuery, enabled, maxResults, includeCustomTokens]);

  return {
    data: searchResult,
    isLoading: isLoadingTokens,
    error,
  };
}

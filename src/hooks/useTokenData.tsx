import { errorManager } from '../lib/error-manager';
import { networkLinks } from '../lib/network-links';
import { Network, networks } from '../config/networks';
import { ListedToken } from '../types/tokens';
import { logger } from '../lib/logger';
import { tokenStorage } from '../lib/custom-token-storage';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface TokenSearchOptions {
  limit?: number;
  includeCustomTokens?: boolean;
}

export interface TokenSearchResult {
  tokens: ListedToken[];
  query: string;
  totalResults: number;
  counts: {
    api: number;
    custom: number;
  };
}

/**
 * The tokens offered on a test network: its list of test tokens, or only its native token.
 */
function getTestnetTokens (network: Network): ListedToken[] {
  const tokens = network.testTokens ?? [network.nativeToken];
  return tokens.map((token) => ({
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    chainId: network.chainId,
    decimals: token.decimals,
    trustWalletLogoUrl: networkLinks.tokenLogo(network.chainId, token.address),
    lastUpdated: Date.now(),
  }));
}

/**
 * The 1inch token list for a main network, read through the dev server's `/api/1inch` proxy
 * (`vite.config.ts`), which adds the API key. Without a key, or if the read fails, only the
 * native token.
 */
async function fetchMainnetTokens (chainId: number): Promise<ListedToken[]> {
  const network = networks.byChainId(chainId)!;

  try {
    const apiKey = import.meta.env.VITE_API_KEY_ONEINCH;
    if (!apiKey) {
      logger.warn('VITE_API_KEY_ONEINCH not configured, falling back to native token');
      return [{
        address: network.nativeToken.address,
        symbol: network.nativeToken.symbol,
        name: network.nativeToken.name,
        chainId,
        decimals: network.nativeToken.decimals,
        trustWalletLogoUrl: networkLinks.tokenLogo(chainId, network.nativeToken.address),
        logoUrl: networkLinks.tokenLogo(chainId, network.nativeToken.address),
        lastUpdated: Date.now(),
      }];
    }

    const response = await fetch(`/api/1inch/v1.1/${chainId}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.status} ${response.statusText}`);
    }

    const tokensData = await response.json();
    return transformTokensData(tokensData, chainId);
  } catch (error) {
    logger.warn(`Failed to fetch from 1inch API: ${errorManager.message(error, String(error))}`);
    return [{
      address: network.nativeToken.address,
      symbol: network.nativeToken.symbol,
      name: network.nativeToken.name,
      chainId,
      decimals: network.nativeToken.decimals,
      trustWalletLogoUrl: networkLinks.tokenLogo(chainId, network.nativeToken.address),
      logoUrl: networkLinks.tokenLogo(chainId, network.nativeToken.address),
      lastUpdated: Date.now(),
    }];
  }
}

/**
 * The native token, then 1inch's tokens without its own entry for the native token.
 */
function transformTokensData (tokensData: Record<string, unknown>, chainId: number): ListedToken[] {
  const network = networks.byChainId(chainId)!;
  const tokens: ListedToken[] = [];

  tokens.push({
    address: network.nativeToken.address,
    symbol: network.nativeToken.symbol,
    name: network.nativeToken.name,
    chainId,
    decimals: network.nativeToken.decimals,
    trustWalletLogoUrl: networkLinks.tokenLogo(chainId, network.nativeToken.address),
    logoUrl: networkLinks.tokenLogo(chainId, network.nativeToken.address),
    lastUpdated: Date.now(),
  });

  const transformedTokens = Object.values(tokensData)
    .filter((token: unknown) => {
      const tokenData = token as Record<string, unknown>;
      return (tokenData.address as string).toLowerCase() !== network.nativeToken.address.toLowerCase();
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
        trustWalletLogoUrl: networkLinks.tokenLogo(chainId, tokenData.address as string),
        lastUpdated: Date.now(),
      };
    });

  tokens.push(...transformedTokens);
  return tokens;
}

/**
 * How well a token matches a search, by the first of these checks it passes: from its exact symbol
 * (100) down to part of its address (10), or 0 if none.
 */
function calculateRelevanceScore (token: ListedToken, query: string): number {
  const normalizedQuery = query.toLowerCase().trim();
  const symbol = token.symbol.toLowerCase();
  const name = token.name.toLowerCase();
  const address = token.address.toLowerCase();

  let score = 0;

  if (symbol === normalizedQuery) score += 100;
  else if (symbol.startsWith(normalizedQuery)) score += 80;
  else if (symbol.includes(normalizedQuery)) score += 60;
  else if (name === normalizedQuery) score += 70;
  else if (name.startsWith(normalizedQuery)) score += 50;
  else if (name.includes(normalizedQuery)) score += 30;
  else if (address.includes(normalizedQuery)) score += 10;

  return score;
}

/**
 * The tokens which match a search, best first and then by name, with how many came from each list.
 */
function mergeAndRankTokens (
  apiTokens: ListedToken[],
  customTokens: ListedToken[],
  query: string,
  maxResults: number,
): { tokens: ListedToken[]; counts: TokenSearchResult['counts'] } {
  const tokenMap = new Map<string, ListedToken & { relevanceScore: number; source: string }>();
  const counts = { api: 0, custom: 0 };

  customTokens.forEach(token => {
    const key = `${token.address.toLowerCase()}-${token.chainId}`;
    const relevanceScore = calculateRelevanceScore(token, query);
    if (relevanceScore > 0) {
      tokenMap.set(key, { ...token, relevanceScore, source: 'custom' });
      counts.custom++;
    }
  });

  // A token in both lists takes the token list's details.
  apiTokens.forEach(token => {
    const key = `${token.address.toLowerCase()}-${token.chainId}`;
    const relevanceScore = calculateRelevanceScore(token, query);
    if (relevanceScore > 0) {
      const existing = tokenMap.get(key);
      tokenMap.set(key, { ...token, relevanceScore, source: 'api' });
      if (!existing) counts.api++;
    }
  });

  const tokens = Array.from(tokenMap.values())
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      return a.name.localeCompare(b.name);
    })
    .slice(0, maxResults)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ relevanceScore: _relevanceScore, source: _source, ...token }) => token);

  return { tokens, counts };
}

/**
 * The tokens offered in the token selector on a chain, with the user's custom tokens after them,
 * and a search over both. Main networks use 1inch's token list; test networks list their test
 * tokens.
 */
export function useTokenData (chainId: number, limit: number = 100) {
  const {
    data: allTokens,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['unified-token-data', chainId],
    queryFn: async (): Promise<ListedToken[]> => {
      const network = networks.byChainId(chainId);

      if (!network) {
        throw new Error(`Unsupported network: ${chainId}`);
      }

      if (network.isTestnet) {
        return getTestnetTokens(network);
      }

      return await fetchMainnetTokens(chainId);
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  const customTokens = useMemo(() => {
    const stored = tokenStorage.getCustomTokensForChain(chainId);
    return stored.map(token => ({
      ...token,
      chainId: token.chainId || chainId,
    })) as ListedToken[];
  }, [chainId]);

  const tokens = useMemo(() => {
    if (!allTokens) return [];

    const combined = [...allTokens];

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
    tokens: tokens || [],
    searchTokens,
    isLoading,
    error,
    refetch,
    customTokens,
  };
}

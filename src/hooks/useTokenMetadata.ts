import { TokenMetadata, tokenMetadataQuery } from '../lib/token-metadata';
import { useCallback, useMemo } from 'react';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useQueries, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

export interface TokenMetadataState {
  metadata: TokenMetadata | undefined;
  isLoading: boolean;
}

export interface TokensMetadata {
  /** By address in lower case. A token whose details can't be read has no `metadata`. */
  byAddress: Record<string, TokenMetadataState>;
  isLoading: boolean;
}

/**
 * A token's details on the network in the URL, read once and shared with every other reader.
 * `isEnabled` is false where the caller already knows what it needs.
 */
export function useTokenMetadata (tokenAddress: string, { isEnabled = true } = {}) {
  const networkDeployment = useCurrentNetwork();
  const query = tokenMetadataQuery({ networkDeployment, tokenAddress });
  return useQuery({ ...query, enabled: isEnabled && query.enabled });
}

/**
 * The details of several tokens, and whether any are still being read.
 */
export function useTokensMetadata (tokenAddresses: string[]): TokensMetadata {
  const networkDeployment = useCurrentNetwork();

  // A string key keeps the list stable while the caller passes new arrays of the same tokens.
  const addressesKey = [...new Set(tokenAddresses.map(address => address.toLowerCase()))].join(',');
  const uniqueAddresses = useMemo(() => (addressesKey ? addressesKey.split(',') : []), [addressesKey]);

  const queries = useMemo(
    () => uniqueAddresses.map(tokenAddress => tokenMetadataQuery({ networkDeployment, tokenAddress })),
    [uniqueAddresses, networkDeployment],
  );

  const combine = useCallback((results: UseQueryResult<TokenMetadata>[]): TokensMetadata => ({
    byAddress: Object.fromEntries(uniqueAddresses.map((address, index) => [address, {
      metadata: results[index].data,
      isLoading: isFirstRead(results[index]),
    }])),
    isLoading: results.some(isFirstRead),
  }), [uniqueAddresses]);

  return useQueries({ queries, combine });
}

/**
 * Reads a token's details outside rendering, such as in an action, through the same cache as
 * `useTokenMetadata`.
 */
export function useFetchTokenMetadata () {
  const networkDeployment = useCurrentNetwork();
  const queryClient = useQueryClient();

  return useCallback(
    (tokenAddress: string) => queryClient.fetchQuery(tokenMetadataQuery({ networkDeployment, tokenAddress })),
    [networkDeployment, queryClient],
  );
}

/**
 * Whether a token's details are being read for the first time. A token whose read failed is
 * read again on the next mount or focus, but it keeps its fallback meanwhile, so that a failure
 * doesn't put the page back into loading.
 */
function isFirstRead (result: UseQueryResult<TokenMetadata>): boolean {
  return result.isLoading && !result.isFetched;
}

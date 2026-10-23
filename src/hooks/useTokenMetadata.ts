import { TokenMetadata, tokenMetadataQuery } from '../lib/token-metadata';
import { useCallback, useMemo } from 'react';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useQueries, useQuery, UseQueryResult } from '@tanstack/react-query';

export interface TokenMetadataState {
  metadata: TokenMetadata | undefined;
  isLoading: boolean;
}

/**
 * A token's details on the network in the URL, read once and shared with every other reader.
 */
export function useTokenMetadata (tokenAddress: string) {
  const networkDeployment = useCurrentNetwork();
  return useQuery(tokenMetadataQuery({ networkDeployment, tokenAddress }));
}

/**
 * The details of several tokens, by address in lower case. A token whose details can't be read
 * has no `metadata`.
 */
export function useTokensMetadata (tokenAddresses: string[]): Record<string, TokenMetadataState> {
  const networkDeployment = useCurrentNetwork();

  // A string key keeps the list stable while the caller passes new arrays of the same tokens.
  const addressesKey = [...new Set(tokenAddresses.map(address => address.toLowerCase()))].join(',');
  const uniqueAddresses = useMemo(() => (addressesKey ? addressesKey.split(',') : []), [addressesKey]);

  const combine = useCallback((results: UseQueryResult<TokenMetadata>[]) => Object.fromEntries(
    uniqueAddresses.map((address, index) => [address, {
      metadata: results[index].data,
      isLoading: results[index].isLoading,
    }]),
  ), [uniqueAddresses]);

  return useQueries({
    queries: uniqueAddresses.map(tokenAddress => tokenMetadataQuery({ networkDeployment, tokenAddress })),
    combine,
  });
}

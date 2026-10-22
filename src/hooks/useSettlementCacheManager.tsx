import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '../lib/logger';
import { useCurrentNetwork } from './useCurrentNetwork';

/**
 * Centralized hook for managing settlement data cache invalidation.
 * This hook should be used once at the app level to handle cache clearing
 * when networks change.
 */
export function useSettlementCacheManager () {
  const queryClient = useQueryClient();
  const { network } = useCurrentNetwork();
  const previousNetworkId = useRef(network.id);

  useEffect(() => {
    if (network.id === previousNetworkId.current) return;
    previousNetworkId.current = network.id;

    logger.info('Network changed, clearing settlement cache', { networkId: network.id, chainId: network.chainId });

    const isSettlementQuery = (queryKey: readonly unknown[]) => queryKey.some(key =>
      typeof key === 'string' && (
        key.includes('settlements-') ||
        key.includes('wallet-settlements-') ||
        key.includes('flows-settlements-')
      ),
    );

    // Clear all settlement-related queries immediately.
    queryClient.invalidateQueries({ predicate: (query) => isSettlementQuery(query.queryKey) });

    // Also clear any stale data immediately.
    queryClient.removeQueries({ predicate: (query) => isSettlementQuery(query.queryKey) });
  }, [network.id, network.chainId, queryClient]);
}

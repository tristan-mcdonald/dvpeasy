import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { contractConfigManager } from '../config/contracts';
import { logger } from '../lib/logger';

/**
 * Centralized hook for managing settlement data cache invalidation.
 * This hook should be used once at the app level to handle cache clearing
 * when networks change.
 */
export function useSettlementCacheManager () {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for network changes from the contract config manager.
    const unsubscribe = contractConfigManager.onNetworkChange((networkId: string, chainId: number) => {
      logger.info('Network changed, clearing settlement cache', { networkId, chainId });

      // Clear all settlement-related queries immediately.
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.some(key =>
            typeof key === 'string' && (
              key.includes('settlements-') ||
              key.includes('wallet-settlements-') ||
              key.includes('flows-settlements-')
            ),
          );
        },
      });

      // Also clear any stale data immediately.
      queryClient.removeQueries({
        predicate: (query) => {
          return query.queryKey.some(key =>
            typeof key === 'string' && (
              key.includes('settlements-') ||
              key.includes('wallet-settlements-') ||
              key.includes('flows-settlements-')
            ),
          );
        },
      });
    });

    return unsubscribe;
  }, [queryClient]);
}

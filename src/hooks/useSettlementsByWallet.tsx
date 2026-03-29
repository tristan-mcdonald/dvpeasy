import { logger } from '../lib/logger';
import { Settlement } from '../types/settlement';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useCallback, useMemo } from 'react';
import { useContractAddresses, useContractConfig } from './useContractConfig';
import { usePolling } from './usePolling';

/**
 * Hook to fetch settlements that involve the connected wallet address.
 */
export function useSettlementsByWallet (maxFetch = 100, enablePolling = false, pollingInterval = 30000) {
  const { address: walletAddress } = useAccount();
  const { dvpAddress, dvpAbi, dvpHelperAddress, dvpHelperAbi } = useContractAddresses();
  const { config, isConfigReady } = useContractConfig();

  // Create a unique query key based on network, contract address, and wallet.
  const queryKeyBase = `wallet-settlements-${config.networkId}-${config.chainId}-${dvpAddress}-${walletAddress}`;

  // Network-specific cache invalidation is handled by useSettlementCacheManager.

  // Get settlement IDs that involve the connected wallet.
  const {
    data: helperData,
    isLoading: isLoadingIds,
    isError: isErrorIds,
    refetch: refetchIds,
  } = useReadContract({
    address: dvpHelperAddress,
    abi: dvpHelperAbi,
    functionName: 'getSettlementsByInvolvedParty',
    args: [
      dvpAddress,
      walletAddress || '0x0000000000000000000000000000000000000000',
      BigInt(0), // startCursor (0 means start from latest).
      BigInt(Math.min(maxFetch, 200)), // pageSize (max 200).
    ],
    chainId: config.chainId,
    query: {
      enabled: isConfigReady && !!walletAddress, // Only run if config is ready and wallet is connected.
      queryKey: [`${queryKeyBase}-ids`],
    },
  });

  // Extract settlement IDs from the helper response.
  const settlementIds = useMemo(() => {
    if (!helperData || !Array.isArray(helperData) || !helperData[0]) return [];
    return helperData[0] as bigint[];
  }, [helperData]);

  // Fetch full settlement details for all involved settlements.
  const {
    data: settlementDatas,
    isLoading: isLoadingData,
    isError: isErrorData,
    refetch: refetchData,
  } = useReadContracts({
    contracts: settlementIds.map((id) => ({
      address: dvpAddress,
      abi: dvpAbi,
      functionName: 'getSettlement',
      args: [id],
      chainId: config.chainId,
    })),
    query: {
      enabled: isConfigReady && settlementIds.length > 0,
    },
  });

  // Map to UI-friendly shape.
  const settlements: Settlement[] = useMemo(() => {
    if (!settlementDatas || !settlementIds.length) return [];
    return settlementDatas.map((data: unknown, idx: number) => {
      // Type assertion for contract read result.
      const settlementData = data as { result?: [string, bigint, unknown[], boolean, boolean] };
      return {
        id: settlementIds[idx].toString(),
        reference: settlementData.result?.[0] as string,
        cutoffDate: Number((settlementData.result?.[1] as bigint).toString()) * 1000,
        isSettled: settlementData.result?.[3] as boolean,
        isAutoSettled: settlementData.result?.[4] as boolean,
      };
    });
  }, [settlementDatas, settlementIds]);

  // Add polling capability
  const polling = usePolling(async () => {
    if (walletAddress) {
      await refetchIds();
      await refetchData();
    }
  }, {
    interval: pollingInterval,
    enabled: enablePolling && !!walletAddress,
    maxRetries: 2,
    backoffMultiplier: 1.5,
  });

  // Combined loading & error states.
  const isLoading = !isConfigReady || isLoadingIds || isLoadingData;
  const isError = isErrorIds || isErrorData;

  // Refetch with error handling
  const refetch = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        refetchIds(),
        refetchData(),
      ]);

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        logger.warn('Some refetch operations failed:', failures);
      }

      return { success: failures.length === 0, errors: failures };
    } catch (error) {
      logger.error('Failed to refetch wallet settlements:', error);
      return { success: false, errors: [error] };
    }
  }, [refetchIds, refetchData]);

  return {
    settlements,
    isLoading,
    isError,
    isRefreshing: polling.isPolling,
    pollingError: polling.lastError,
    refetch,
    isWalletConnected: !!walletAddress,
    // Polling controls
    startPolling: polling.startPolling,
    stopPolling: polling.stopPolling,
    isPolling: polling.isPolling,
    timeUntilNextPoll: polling.timeUntilNextPoll,
  };
}

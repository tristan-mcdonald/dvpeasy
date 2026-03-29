import { useCallback, useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { contractValidationManager } from '../lib/contract-validation';
import { logger } from '../lib/logger';
import { Settlement } from '../types/settlement';
import { useContractAddresses, useContractConfig } from './useContractConfig';
import { useDataFetcher } from './useDataFetcher';
import { usePolling } from './usePolling';

/**
 * Validation for contract settlement results with detailed error reporting.
 */

/**
 * Safely extracts settlement data from contract result with validation and fallback
 * values.
 */
function extractSettlementData (data: unknown, settlementId: string): Settlement {
  try {
    // Validate settlement ID format.
    const validatedId = contractValidationManager.validateSettlementId(settlementId);

    if (!contractValidationManager.isValidContractSettlementResult(data)) {
      logger.warn(`Invalid contract data for settlement ${settlementId}:`, data);
      return createFallbackSettlement(validatedId.toString());
    }

    const [reference, cutoffDate, flows, isSettled, isAutoSettled] = data.result;

    return {
      id: validatedId.toString(),
      reference: reference || 'Untitled Settlement',
      cutoffDate: Number(cutoffDate.toString()) * 1000,
      isSettled: Boolean(isSettled),
      isAutoSettled: Boolean(isAutoSettled),
      flows: flows || [],
    };
  } catch (error) {
    logger.error(`Failed to extract settlement data for ${settlementId}:`, error);
    return createFallbackSettlement(settlementId);
  }
}

/**
 * Creates a fallback settlement object for invalid data.
 */
function createFallbackSettlement (id: string): Settlement {
  return {
    id,
    reference: 'Invalid Settlement',
    cutoffDate: 0,
    isSettled: false,
    isAutoSettled: false,
    flows: [],
  };
}

/**
 * Hook to fetch all settlements from the contract with polling and error handling.
 */
export function useSettlements (maxFetch = 50, enablePolling = false, pollingInterval = 30000) {
  const { dvpAddress, dvpAbi } = useContractAddresses();
  const { config } = useContractConfig();

  // Create a unique query key based on network and contract address.
  const queryKeyBase = `settlements-${config.networkId}-${config.chainId}-${dvpAddress}`;

  // Network-specific cache invalidation is handled by useSettlementCacheManager.

  // Read the total settlement counter.
  const {
    data: counter,
    isLoading: isLoadingCounter,
    isError: isErrorCounter,
    error: counterError,
    refetch: refetchCounter,
  } = useReadContract({
    address: dvpAddress,
    abi: dvpAbi,
    functionName: 'settlementIdCounter',
    chainId: config.chainId,
    query: {
      enabled: config.chainId > 0 && !!dvpAddress, // Only run if config is valid
      queryKey: [`${queryKeyBase}-counter`],
    },
  });

  // Build an array of settlement IDs to scan in descending order (newest first).
  const settlementIds = useMemo(() => {
    try {
      if (!counter) return [];
      const total = contractValidationManager.validateSettlementId(counter);
      const maxToCheck = Math.min(Number(total), maxFetch);
      return Array.from({ length: maxToCheck }, (_, i) => total - BigInt(i));
    } catch (error) {
      logger.error('Failed to generate settlement IDs:', error);
      return [];
    }
  }, [counter, maxFetch]);

  // Fetch full settlement details for all settlements.
  const {
    data: settlementDatas,
    isLoading: isLoadingData,
    isError: isErrorData,
    error: dataError,
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
      enabled: config.chainId > 0 && !!dvpAddress && settlementIds.length > 0,
    },
  });

  // Data fetcher with retry logic and de-duplication.
  const {
    error: dataFetcherError,
    isRefreshing,
    forceRefresh,
    reset,
  } = useDataFetcher(() => Promise.resolve([]), {
    deduplication: {
      key: `${queryKeyBase}-all-settlements-${maxFetch}`,
      cacheDuration: 10000,
      deduplicateRequests: true,
    },
    retry: {
      maxRetries: 2,
    },
  });

  // Add polling capability for real-time updates.
  const polling = usePolling(async () => {
    await refetchCounter();
    await refetchData();
  }, {
    interval: pollingInterval,
    enabled: enablePolling,
    maxRetries: 2,
    backoffMultiplier: 1.5,
  });

  // Map to UI-friendly shape using safe type extraction with error handling.
  const settlements: Settlement[] = useMemo(() => {

  // Log contract call states for debugging.
  logger.info('useSettlements debug info:', {
    counter: counter?.toString(),
    isLoadingCounter,
    isErrorCounter,
    counterError: counterError?.message,
    settlementIds: settlementIds.map(id => id.toString()),
    settlementDatasLength: settlementDatas?.length,
    isLoadingData,
    isErrorData,
    dataError: dataError?.message,
    chainId: config.chainId,
    dvpAddress,
    networkId: config.networkId,
  });

    if (!settlementDatas || !settlementIds.length) {
      logger.warn('No settlement data or IDs available', {
        hasSettlementDatas: !!settlementDatas,
        settlementIdsLength: settlementIds.length,
        isErrorCounter,
        isErrorData,
      });
      return [];
    }

    return settlementDatas.map((data: unknown, idx: number) => {
      try {
        const settlementId = settlementIds[idx]?.toString() ?? idx.toString();
        logger.info(`Processing settlement ${settlementId} at index ${idx}:`, data);
        return extractSettlementData(data, settlementId);
      } catch (error) {
        logger.error(`Failed to process settlement at index ${idx}:`, error);
        return createFallbackSettlement(idx.toString());
      }
    }).filter(Boolean); // Remove any null/undefined entries.
  }, [settlementDatas, settlementIds, counter, isLoadingCounter, isErrorCounter, counterError, isLoadingData, isErrorData, dataError, config.chainId, config.networkId, dvpAddress]);

  // Combined loading & error states.
  const isLoading = isLoadingCounter || isLoadingData;
  const isError = isErrorCounter || isErrorData;

  // Refetch with standardised error handling.
  const refetch = useCallback(async () => {
    try {
      await Promise.all([
        refetchCounter(),
        refetchData(),
      ]);
      return { success: true, error: null };
    } catch (error) {
      logger.error('Failed to refetch settlements:', error);
      return { success: false, error };
    }
  }, [refetchCounter, refetchData]);

  return {
    settlements,
    isLoading,
    isError,
    isRefreshing: polling.isPolling || isRefreshing,
    error: dataFetcherError || counterError || dataError, // Expose specific errors
    refetch,
    forceRefresh,
    reset,
    // Polling controls.
    startPolling: polling.startPolling,
    stopPolling: polling.stopPolling,
    isPolling: polling.isPolling,
    timeUntilNextPoll: polling.timeUntilNextPoll,
    // Debug info
    debugInfo: {
      counter: counter?.toString(),
      settlementIds: settlementIds.map(id => id.toString()),
      isErrorCounter,
      isErrorData,
      counterError: counterError?.message,
      dataError: dataError?.message,
    },
  };
}

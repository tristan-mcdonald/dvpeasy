import { config } from '../config/wagmi';
import { errorManager } from '../lib/error-manager';
import { logger } from '../lib/logger';
import { readContract } from 'wagmi/actions';
import { PartyStatus, TokenStatus } from '../types/settlement-details';
import { useCallback, useEffect, useState } from 'react';
import { useContractAddresses, useContractConfig } from './useContractConfig';
import { useDataFetcher } from './useDataFetcher';

/**
 * Manages party-specific status data for the current wallet address.
 *
 * @param settlementId - The settlement ID to fetch party status for.
 * @param address - The wallet address to get party status for.
 * @returns Object containing party status data, loading state, error state, and control functions.
 */
export function usePartyStatus (
  settlementId: string | undefined,
  address: string | undefined,
) {
  const { dvpAddress, dvpAbi } = useContractAddresses();
  const { config: contractConfig } = useContractConfig();

  const fetchPartyStatusInternal = useCallback(async (): Promise<PartyStatus | null> => {
    if (!settlementId || !address) {
      return null;
    }

    const partyStatusData = await readContract(config, {
      address: dvpAddress,
      abi: dvpAbi,
      functionName: 'getSettlementPartyStatus',
      args: [BigInt(settlementId), address],
      chainId: contractConfig.chainId,
    });

    if (!partyStatusData) {
      return null;
    }

    // Type casting for party status data.
    const partyResult = partyStatusData as [boolean, bigint, bigint, TokenStatus[]];
    const [isApproved, etherRequired, etherDeposited, tokenStatuses] = partyResult;

    // Ensure tokenStatuses is properly converted to array.
    let tokenStatusesArray: TokenStatus[] = [];
    try {
      if (Array.isArray(tokenStatuses)) {
        tokenStatusesArray = tokenStatuses;
      } else {
        // Safe fallback for non-array tokenStatuses.
        tokenStatusesArray = [];
        logger.warn('TokenStatuses is not an array, using empty array');
      }
    } catch (error) {
      logger.warn('Error processing tokenStatuses:', error);
      tokenStatusesArray = [];
    }

    return {
      isApproved,
      etherRequired,
      etherDeposited,
      tokenStatuses: tokenStatusesArray,
    };
  }, [settlementId, address, dvpAddress, dvpAbi, contractConfig.chainId]);

  const {
    data: partyStatus,
    isLoading,
    error,
    isRefreshing,
    lastFetched,
    fetch,
    forceRefresh,
    reset,
  } = useDataFetcher(fetchPartyStatusInternal, {
    deduplication: {
      key: `party-status-${settlementId}-${address}`,
      cacheDuration: 3000,
      deduplicateRequests: true,
    },
    retry: {
      maxRetries: 3,
    },
  });

  // Keep a local copy of party status that can be updated directly.
  const [localPartyStatus, setLocalPartyStatus] = useState<PartyStatus | null>(partyStatus);

  // Update local data when fetched data changes.
  useEffect(() => {
    setLocalPartyStatus(partyStatus);
  }, [partyStatus]);

  const fetchPartyStatus = useCallback(async () => {
    const result = await fetch();

    if (result.error) {
      errorManager.log(result.error, { settlementId, address });
    }

    return result;
  }, [fetch, settlementId, address]);

  // Memoize the fetchPartyStatus function to prevent dependency changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedFetchPartyStatus = useCallback(fetchPartyStatus, [settlementId, address]);

  const updatePartyStatus = useCallback((
    isApproved: boolean,
    etherRequired: bigint,
    etherDeposited: bigint,
    tokenStatuses: TokenStatus[],
  ) => {
    // Update local party status directly without triggering a full refresh.
    setLocalPartyStatus({
      isApproved,
      etherRequired,
      etherDeposited,
      tokenStatuses,
    });
  }, []);

  return {
    partyStatus: localPartyStatus,
    isLoading,
    error,
    isRefreshing,
    lastFetched,
    fetchPartyStatus: memoizedFetchPartyStatus,
    updatePartyStatus,
    forceRefresh,
    reset,
  };
}

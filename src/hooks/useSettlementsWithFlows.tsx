import { DVP_ABI } from '../config/contracts/abis';
import { Flow } from '../types/settlement';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useReadContract, useReadContracts } from 'wagmi';
import { useMemo } from 'react';
import { logger } from '../lib/logger';

interface ContractFlow {
  token: string;
  from: string;
  to: string;
  amountOrId: bigint;
  isNFT: boolean;
}


export interface SettlementWithFlows {
  id: string;
  reference: string;
  cutoffDate: number;
  isSettled: boolean;
  isAutoSettled: boolean;
  flows: Flow[];
}

/**
 * Hook to fetch settlements with detailed flow data for filtering purposes.
 */
export function useSettlementsWithFlows (maxFetch = 50, tokenFilter?: string) {
  const { deployment, network } = useCurrentNetwork();
  const { dvpAddress } = deployment;

  // Create a unique query key based on network and contract address.
  const queryKeyBase = `flows-settlements-${network.id}-${network.chainId}-${dvpAddress}`;

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
    abi: DVP_ABI,
    functionName: 'settlementIdCounter',
    chainId: network.chainId,
    query: {
      queryKey: [`${queryKeyBase}-counter`],
    },
  });

  // Build an array of settlement IDs to scan in descending order (newest first).
  const settlementIds = useMemo(() => {
    if (!counter) return [];
    const total = Number(counter.toString());
    const maxToCheck = Math.min(total, maxFetch);
    return Array.from({ length: maxToCheck }, (_, i) => BigInt(total - i));
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
      abi: DVP_ABI,
      functionName: 'getSettlement',
      args: [id],
      chainId: network.chainId,
    })),
    query: {
      enabled: settlementIds.length > 0,
    },
  });

  // Map to UI-friendly shape with flows.
  const settlementsWithFlows: SettlementWithFlows[] = useMemo(() => {
    // Log debug info for flows hook.
    logger.info('useSettlementsWithFlows debug info:', {
      counter: counter?.toString(),
      isLoadingCounter,
      isErrorCounter,
      counterError: counterError?.message,
      settlementIds: settlementIds.map(id => id.toString()),
      settlementDatasLength: settlementDatas?.length,
      isLoadingData,
      isErrorData,
      dataError: dataError?.message,
      chainId: network.chainId,
      dvpAddress,
      networkId: network.id,
    });

    if (!settlementDatas) {
      logger.warn('useSettlementsWithFlows: No settlement data available', {
        isErrorCounter,
        isErrorData,
        counterError: counterError?.message,
        dataError: dataError?.message,
      });
      return [];
    }

    return settlementDatas.flatMap((data: unknown, idx: number) => {
      // Type assertion for contract read result.
      const settlementData = data as { result?: [string, bigint, ContractFlow[], boolean, boolean] };
      // A read which failed has no result, so it's left out rather than crashing the dashboard.
      if (!settlementData.result) return [];
      logger.info(`useSettlementsWithFlows: Processing settlement ${settlementIds[idx]} at index ${idx}:`, data);

      const flows = settlementData.result?.[2] || [];
      return {
        id: settlementIds[idx].toString(),
        reference: settlementData.result?.[0] as string,
        cutoffDate: Number((settlementData.result?.[1] as bigint).toString()) * 1000,
        isSettled: settlementData.result?.[3] as boolean,
        isAutoSettled: settlementData.result?.[4] as boolean,
        flows: flows.map((flow: ContractFlow) => ({
          token: flow.token,
          from: flow.from,
          to: flow.to,
          amount: flow.amountOrId.toString(),
          isNFT: flow.isNFT,
        })),
      };
    });
  }, [settlementDatas, settlementIds, counter, isLoadingCounter, isErrorCounter, counterError, isLoadingData, isErrorData, dataError, network.chainId, network.id, dvpAddress]);

  // Filter settlements by token if specified.
  const filteredSettlements = useMemo(() => {
    if (!tokenFilter || tokenFilter === '') {
      return settlementsWithFlows;
    }

    const normalizedFilter = tokenFilter.toLowerCase();
    return settlementsWithFlows.filter(settlement =>
      settlement.flows.some(flow =>
        flow.token.toLowerCase() === normalizedFilter,
      ),
    );
  }, [settlementsWithFlows, tokenFilter]);

  // Combined loading & error states.
  const isLoading = isLoadingCounter || isLoadingData;
  const isError = isErrorCounter || isErrorData;

  // Refetch all.
  const refetch = () => {
    refetchCounter();
    refetchData();
  };

  return {
    settlements: filteredSettlements,
    totalSettlements: settlementsWithFlows.length,
    isLoading,
    isError,
    refetch,
  };
}

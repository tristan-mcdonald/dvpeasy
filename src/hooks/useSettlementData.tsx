import toast from 'react-hot-toast';
import { config } from '../config/wagmi';
import { Flow, Settlement } from '../types/settlement-details';
import { tokenManager } from '../lib/token-manager';
import { errorManager } from '../lib/error-manager';
import { utilityManager } from '../lib/utils';
import { readContract } from 'wagmi/actions';
import { SettlementNotFoundError } from '../types/errors';
import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useContractAddresses, useContractConfig } from './useContractConfig';
import { logger } from '../lib/logger';
import { useDataFetcher } from './useDataFetcher';

export interface FormattedFlow extends Flow {
  formattedAmount: string
}

export interface SettlementDataResult {
  settlement: Settlement | null
  formattedFlows: FormattedFlow[]
}

/**
 * Fetches and manages core settlement data including flows and formatting.
 *
 * @param settlementId - The settlement ID to fetch data for.
 * @returns Object containing settlement data, formatted flows, loading state, error state, and control functions.
 */
export function useSettlementData (settlementId: string | undefined) {
  const { dvpAddress, dvpAbi } = useContractAddresses();
  const { config: contractConfig } = useContractConfig();

  const prevFormattedSettlement = useRef<Settlement | null>(null);
  const prevFormattedFlowsRef = useRef<FormattedFlow[]>([]);

  const fetchSettlementDataInternal = useCallback(async (): Promise<SettlementDataResult> => {
    if (!settlementId) {
      return { settlement: null, formattedFlows: [] };
    }

    // Validate that settlementId is a valid numeric string.
    if (!/^\d+$/.test(settlementId)) {
      const error = new Error('Invalid settlement ID format');
      errorManager.log(error, { settlementId });
      throw error;
    }

    const settlementData = await readContract(config, {
      address: dvpAddress,
      abi: dvpAbi,
      functionName: 'getSettlement',
      args: [BigInt(settlementId)],
      chainId: contractConfig.chainId,
    });

    if (!settlementData) {
      const error = new SettlementNotFoundError(settlementId);
      errorManager.log(error, { settlementId });
      throw error;
    }

    // Convert array response to Settlement object with type casting.
    const contractResult = settlementData as [string, bigint, Flow[], boolean, boolean];
    const [reference, cutoffDate, flows, isSettled, isAutoSettled] = contractResult;

    if (
      reference === undefined ||
      cutoffDate === undefined ||
      flows === undefined
    ) {
      throw new Error('Invalid settlement data received.');
    }

    // Ensure flows is properly converted to array.
    let flowsArray: Flow[] = [];
    try {
      if (Array.isArray(flows)) {
        flowsArray = flows;
      } else {
        // Safe fallback for non-array flows.
        flowsArray = [];
        logger.warn('Flows is not an array, using empty array');
      }
    } catch (error) {
      logger.warn('Error processing flows:', error);
      flowsArray = [];
    }

    const formattedSettlement: Settlement = {
      settlementReference: reference.toString(),
      cutoffDate,
      flows: flowsArray,
      isSettled,
      isAutoSettled,
    };

    // Skip formatting if settlement hasn't changed.
    if (utilityManager.isEqual(prevFormattedSettlement.current, formattedSettlement)) {
      return {
        settlement: prevFormattedSettlement.current,
        formattedFlows: prevFormattedFlowsRef.current, // Return cached formatted flows.
      };
    }

    prevFormattedSettlement.current = formattedSettlement;

    // Format flow amounts with proper decimals.
    const formatted = await Promise.all(flowsArray.map(async (flow: Flow) => {
      const formattedAmount = await tokenManager.formatTokenAmount(flow.amountOrId, flow.token);
      return {
        ...flow,
        formattedAmount,
      };
    }));

    // Cache the formatted flows for future use.
    prevFormattedFlowsRef.current = formatted;

    return {
      settlement: formattedSettlement,
      formattedFlows: formatted,
    };
  }, [settlementId, dvpAddress, dvpAbi, contractConfig.chainId]);

  const {
    data,
    isLoading,
    error,
    isRefreshing,
    lastFetched,
    fetch,
    forceRefresh,
    reset,
  } = useDataFetcher(fetchSettlementDataInternal, {
    deduplication: {
      key: `settlement-data-${settlementId}`,
      cacheDuration: 5000,
      deduplicateRequests: true,
    },
    retry: {
      maxRetries: 3,
      shouldRetry: (error, retryCount) => {
        // Don't retry invalid format or settlement not found errors.
        return !(error instanceof SettlementNotFoundError) && retryCount < 3;
      },
    },
  });

  // Keep a local copy of settlement data that can be updated directly.
  const [localSettlementData, setLocalSettlementData] = useState<SettlementDataResult | null>(data);

  // Update local data when fetched data changes.
  useEffect(() => {
    if (data) {
      /**
       * Only update if we have new data with formatted flows, or if the settlement itself changed.
       * This prevents wiping out cached formatted flows when we skip formatting due to unchanged
       * data.
       */
      if (data.formattedFlows.length > 0 || !localSettlementData || data.settlement !== localSettlementData.settlement) {
        setLocalSettlementData(data);
      }
    }
  }, [data, localSettlementData]);

  const fetchSettlementData = useCallback(async (showLoadingState = true) => {
    const result = await fetch({ showLoadingState });

    if (result.error && showLoadingState) {
      toast.error(errorManager.formatUserMessage(result.error));
    }

    return result;
  }, [fetch]);

  // Memoize the fetchSettlementData function to prevent dependency changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedFetchSettlementData = useCallback(fetchSettlementData, [settlementId]);

  const updateSettlementStatus = useCallback((isSettled: boolean, isAutoSettled: boolean) => {
    // Update the cached settlement data in memory.
    if (prevFormattedSettlement.current) {
      prevFormattedSettlement.current = {
        ...prevFormattedSettlement.current,
        isSettled,
        isAutoSettled,
      };
    }

    // Update local settlement data directly without triggering a full refresh.
    setLocalSettlementData(prevData => {
      if (prevData?.settlement) {
        return {
          ...prevData,
          settlement: {
            ...prevData.settlement,
            isSettled,
            isAutoSettled,
          },
        };
      }
      return prevData;
    });
  }, []);

  // Memoize the formattedFlows to prevent recreating the array on every render.
  const memoizedFormattedFlows = useMemo(() => {
    return localSettlementData?.formattedFlows || [];
  }, [localSettlementData?.formattedFlows]);

  return {
    settlement: localSettlementData?.settlement || null,
    formattedFlows: memoizedFormattedFlows,
    isLoading,
    error,
    isRefreshing,
    lastFetched,
    fetchSettlementData: memoizedFetchSettlementData,
    updateSettlementStatus,
    forceRefresh,
    reset,
  };
}

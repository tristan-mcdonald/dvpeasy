import { config } from '../config/wagmi';
import { errorManager } from '../lib/error-manager';
import { readContract } from 'wagmi/actions';
import { TokenStatus, Settlement } from '../types/settlement-details';
import { useCallback, useState } from 'react';
import { useContractAddresses, useContractConfig } from './useContractConfig';
import { useDataFetcher } from './useDataFetcher';

export interface ApprovalStatusData {
  allPartiesApproved: boolean
  allApprovalsComplete: boolean
}

/**
 * Manages settlement approval status checking for all parties and tokens.
 *
 * @param settlementId - The settlement ID to check approvals for.
 * @param settlement - The settlement data object.
 * @returns Object containing approval status data, loading state, error state, and control functions.
 */
export function useSettlementApprovals (
  settlementId: string | undefined,
  settlement: Settlement | null,
) {
  const { dvpAddress, dvpAbi } = useContractAddresses();
  const { config: contractConfig } = useContractConfig();

  const [localState, setLocalState] = useState({
    allPartiesApproved: false,
    allApprovalsComplete: false,
  });

  const checkAllPartiesApprovedInternal = useCallback(async (): Promise<boolean> => {
    if (!settlementId || !settlement) return false;

    // Check if the settlement is approved by all parties.
    const isApproved = await readContract(config, {
      address: dvpAddress,
      abi: dvpAbi,
      functionName: 'isSettlementApproved',
      args: [BigInt(settlementId)],
      chainId: contractConfig.chainId,
    });

    return isApproved as boolean;
  }, [settlementId, settlement, dvpAddress, dvpAbi, contractConfig.chainId]);

  const checkAllApprovalsCompleteInternal = useCallback(async (): Promise<boolean> => {
    if (!settlementId || !settlement) return false;

    // First check if all parties approved the settlement.
    const isSettlementApproved = await readContract(config, {
      address: dvpAddress,
      abi: dvpAbi,
      functionName: 'isSettlementApproved',
      args: [BigInt(settlementId)],
      chainId: contractConfig.chainId,
    });

    if (!isSettlementApproved) {
      return false;
    }

    // Get all unique parties from settlement flows.
    const parties = new Set<string>();
    settlement.flows.forEach(flow => {
      parties.add(flow.from.toLowerCase());
      parties.add(flow.to.toLowerCase());
    });

    // Check each party's token approvals.
    for (const partyAddress of parties) {
      const partyStatusData = await readContract(config, {
        address: dvpAddress,
        abi: dvpAbi,
        functionName: 'getSettlementPartyStatus',
        args: [BigInt(settlementId), partyAddress as `0x${string}`],
        chainId: contractConfig.chainId,
      });

      if (partyStatusData) {
        const partyResult = partyStatusData as [boolean, bigint, bigint, TokenStatus[]];
        const [, , , tokenStatuses] = partyResult;

        // Check if all token approvals are sufficient.
        const tokenStatusesArray = Array.isArray(tokenStatuses) ? tokenStatuses : [];

        for (const tokenStatus of tokenStatusesArray) {
          const hasEnoughApproved = tokenStatus.amountOrIdApprovedForDvp >= tokenStatus.amountOrIdRequired;
          if (!hasEnoughApproved) {
            return false;
          }
        }
      }
    }

    return true;
  }, [settlementId, settlement, dvpAddress, dvpAbi, contractConfig.chainId]);

  const partiesApprovedFetcher = useDataFetcher(checkAllPartiesApprovedInternal, {
    deduplication: {
      key: `parties-approved-${settlementId}`,
      cacheDuration: 3000,
      deduplicateRequests: true,
    },
    retry: {
      maxRetries: 2,
    },
  });

  const approvalsCompleteFetcher = useDataFetcher(checkAllApprovalsCompleteInternal, {
    deduplication: {
      key: `approvals-complete-${settlementId}`,
      cacheDuration: 2000,
      deduplicateRequests: true,
    },
    retry: {
      maxRetries: 2,
    },
  });

  const checkAllPartiesApproved = useCallback(async () => {
    const result = await partiesApprovedFetcher.fetch();

    if (result.error) {
      errorManager.log(result.error, { settlementId, operation: 'checkAllPartiesApproved' });
    } else if (result.data !== null) {
      setLocalState(prevState => ({
        ...prevState,
        allPartiesApproved: result.data!,
      }));
    }

    return result;
  }, [partiesApprovedFetcher, settlementId]);

  const checkAllApprovalsComplete = useCallback(async () => {
    const result = await approvalsCompleteFetcher.fetch();

    if (result.error) {
      errorManager.log(result.error, { settlementId, operation: 'checkAllApprovalsComplete' });
      return false;
    }

    return result.data || false;
  }, [approvalsCompleteFetcher, settlementId]);

  const updateAllApprovalsComplete = useCallback(async () => {
    if (!settlement || settlement.isSettled) return;

    const allComplete = await checkAllApprovalsComplete();
    setLocalState(prevState => ({
      ...prevState,
      allApprovalsComplete: allComplete,
    }));
  }, [settlement, checkAllApprovalsComplete]);

  const updateAllPartiesApproved = useCallback((isApproved: boolean) => {
    setLocalState(prevState => ({
      ...prevState,
      allPartiesApproved: isApproved,
    }));
  }, []);

  return {
    ...localState,
    isLoading: partiesApprovedFetcher.isLoading || approvalsCompleteFetcher.isLoading,
    error: partiesApprovedFetcher.error || approvalsCompleteFetcher.error,
    isRefreshing: partiesApprovedFetcher.isRefreshing || approvalsCompleteFetcher.isRefreshing,
    checkAllPartiesApproved,
    checkAllApprovalsComplete,
    updateAllApprovalsComplete,
    updateAllPartiesApproved,
    forceRefreshPartiesApproved: partiesApprovedFetcher.forceRefresh,
    forceRefreshApprovalsComplete: approvalsCompleteFetcher.forceRefresh,
    resetPartiesApproved: partiesApprovedFetcher.reset,
    resetApprovalsComplete: approvalsCompleteFetcher.reset,
  };
}

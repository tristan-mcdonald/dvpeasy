import { config } from '../config/wagmi';
import { errorManager } from '../lib/error-manager';
import { logger } from '../lib/logger';
import { readContract } from 'wagmi/actions';
import { Settlement, Flow, TokenStatus } from '../types/settlement-details';
import { useCallback, useMemo } from 'react';
import { useContractAddresses, useContractConfig } from './useContractConfig';
import { usePolling } from './usePolling';

/**
 * Callback functions for updating dynamic settlement data.
 */
interface DynamicDataCallbacks {
  updateSettlementStatus: (isSettled: boolean, isAutoSettled: boolean) => void
  updatePartyStatus: (
    isApproved: boolean,
    etherRequired: bigint,
    etherDeposited: bigint,
    tokenStatuses: TokenStatus[],
  ) => void
  updateAllPartiesApproved: (isApproved: boolean) => void
  updateAllApprovalsComplete: () => Promise<void>
}

/**
 * Manages automatic polling and manual refresh of dynamic settlement data.
 * Includes auto-refresh functionality for unsettled, non-expired settlements.
 *
 * @param settlementId - The settlement ID to poll data for.
 * @param settlement - The settlement data object.
 * @param address - The wallet address for party-specific data.
 * @param isSettlementExpired - Function to check if settlement has expired.
 * @param callbacks - Callback functions for updating various data states.
 * @returns Object containing polling state and refresh control functions.
 */
export function useSettlementPolling (
  settlementId: string | undefined,
  settlement: Settlement | null,
  address: string | undefined,
  isSettlementExpired: () => boolean,
  callbacks: DynamicDataCallbacks,
) {
  const { dvpAddress, dvpAbi } = useContractAddresses();
  const { config: contractConfig } = useContractConfig();

  const fetchDynamicSettlementData = useCallback(async () => {
    if (!settlementId || !settlement) return;

    try {
      // Only fetch dynamic data: settlement status, party status, and approval status.
      const [settlementData, partyStatusData, approvalStatusData] = await Promise.all([
        readContract(config, {
          address: dvpAddress,
          abi: dvpAbi,
          functionName: 'getSettlement',
          args: [BigInt(settlementId)],
          chainId: contractConfig.chainId,
        }),
        address ? readContract(config, {
          address: dvpAddress,
          abi: dvpAbi,
          functionName: 'getSettlementPartyStatus',
          args: [BigInt(settlementId), address],
          chainId: contractConfig.chainId,
        }) : null,
        readContract(config, {
          address: dvpAddress,
          abi: dvpAbi,
          functionName: 'isSettlementApproved',
          args: [BigInt(settlementId)],
          chainId: contractConfig.chainId,
        }),
      ]);

      if (settlementData) {
        // Only update settlement status fields, keep flows and other static data.
        const contractResult = settlementData as [string, bigint, Flow[], boolean, boolean];
        const [, , , isSettled, isAutoSettled] = contractResult;

        callbacks.updateSettlementStatus(isSettled, isAutoSettled);
      }

      if (address && partyStatusData) {
        // Update party status.
        const partyResult = partyStatusData as [boolean, bigint, bigint, TokenStatus[]];
        const [isApproved, etherRequired, etherDeposited, tokenStatuses] = partyResult;

        let tokenStatusesArray: TokenStatus[] = [];
        try {
          if (Array.isArray(tokenStatuses)) {
            tokenStatusesArray = tokenStatuses;
          } else {
            tokenStatusesArray = [];
            logger.warn('TokenStatuses is not an array, using empty array');
          }
        } catch (error) {
          logger.warn('Error processing tokenStatuses:', error);
          tokenStatusesArray = [];
        }

        callbacks.updatePartyStatus(isApproved, etherRequired, etherDeposited, tokenStatusesArray);
      }

      // Update approval status.
      if (approvalStatusData !== undefined) {
        callbacks.updateAllPartiesApproved(approvalStatusData as boolean);
      }

      // Also check if all approvals (party + token) are complete.
      await callbacks.updateAllApprovalsComplete();
    } catch (error) {
      const parsedError = errorManager.parse(error, { settlementId });
      errorManager.log(parsedError, { settlementId, operation: 'fetchDynamicSettlementData' });
      throw parsedError; // Re-throw for polling hook to handle retries
    }
  }, [settlementId, settlement, address, dvpAddress, dvpAbi, contractConfig.chainId, callbacks]);

  // Memoize the polling config to prevent infinite loops.
  const pollingConfig = useMemo(() => ({
    interval: 10000,
    enabled: Boolean(settlement && !settlement.isSettled && !isSettlementExpired()),
    stopCondition: () => Boolean(settlement?.isSettled || isSettlementExpired()),
    maxRetries: 3,
    backoffMultiplier: 2,
    maxBackoffDelay: 30000,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [settlement]); // isSettlementExpired omitted to prevent infinite loop since it depends on settlement

  // Use the standardized polling hook.
  const polling = usePolling(fetchDynamicSettlementData, pollingConfig);

  const refreshData = useCallback(async () => {
    try {
      await fetchDynamicSettlementData();
    } catch {
      // Error already handled in fetchDynamicSettlementData. Keep catch block to prevent bubbling.
    }
  }, [fetchDynamicSettlementData]);

  const manualRefresh = useCallback(async () => {
    try {
      await fetchDynamicSettlementData();
    } catch {
      // Error already handled in fetchDynamicSettlementData. Keep catch block to prevent bubbling.
    }
  }, [fetchDynamicSettlementData]);

  return {
    isRefreshing: polling.isPolling,
    isManualRefreshing: false,
    refreshData,
    manualRefresh,
    fetchDynamicSettlementData,
    // Expose polling controls.
    startPolling: polling.startPolling,
    stopPolling: polling.stopPolling,
    restartPolling: polling.restartPolling,
    pollingError: polling.lastError,
    timeUntilNextPoll: polling.timeUntilNextPoll,
  };
}

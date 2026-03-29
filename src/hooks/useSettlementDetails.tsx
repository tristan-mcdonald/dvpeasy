import { useAccount, useWalletClient } from 'wagmi';
import { useCallback, useEffect, useMemo } from 'react';
import { useContractConfig } from './useContractConfig';
import { useParams } from 'react-router-dom';
import { usePartyStatus } from './usePartyStatus';
import { useSettlementApprovals } from './useSettlementApprovals';
import { useSettlementData } from './useSettlementData';
import { useSettlementPolling } from './useSettlementPolling';
import { useSettlementValidation } from './useSettlementValidation';

/**
 * Main hook that orchestrates all settlement-related data management.
 * Combines settlement data fetching, party status, approvals, validation, and polling.
 *
 * @returns Complete settlement details state and control functions for the SettlementDetails page.
 */
export function useSettlementDetails () {
  const { settlementId } = useParams();
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { config: contractConfig } = useContractConfig();


  // Initialise all hooks.
  const {
    settlement,
    formattedFlows,
    isLoading: isLoadingData,
    error: dataError,
    fetchSettlementData,
    updateSettlementStatus,
  } = useSettlementData(settlementId);

  const {
    partyStatus,
    error: partyStatusError,
    fetchPartyStatus,
    updatePartyStatus,
  } = usePartyStatus(settlementId, address);

  const {
    allPartiesApproved,
    allApprovalsComplete,
    error: approvalsError,
    checkAllPartiesApproved,
    updateAllApprovalsComplete,
    updateAllPartiesApproved,
  } = useSettlementApprovals(settlementId, settlement);

  const {
    isParticipant,
    networkError,
    isSettlementExpired,
    walletChainId,
  } = useSettlementValidation(settlement, address);

  const callbacks = useMemo(() => ({
    updateSettlementStatus,
    updatePartyStatus,
    updateAllPartiesApproved,
    updateAllApprovalsComplete,
  }), [updateSettlementStatus, updatePartyStatus, updateAllPartiesApproved, updateAllApprovalsComplete]);

  const {
    isRefreshing,
    isManualRefreshing,
    refreshData,
    manualRefresh,
  } = useSettlementPolling(
    settlementId,
    settlement,
    address,
    isSettlementExpired,
    callbacks,
  );

  // Determine the overall loading state and error.
  const isLoading = isLoadingData || (networkError !== null);
  const error = networkError || dataError || partyStatusError || approvalsError;

  const fetchAllSettlementData = useCallback(async (showLoadingState = true) => {
    if (!settlementId) return;

    // Handle network validation.
    if (networkError) {
      return;
    }

    await fetchSettlementData(showLoadingState);
    if (address) {
      await fetchPartyStatus();
    }
  }, [settlementId, networkError, fetchSettlementData, address, fetchPartyStatus]);





  // Initial data loading.
  useEffect(() => {
    if (settlementId && walletChainId) {
      fetchAllSettlementData(true);
    }
  }, [settlementId, walletChainId, contractConfig.chainId, fetchAllSettlementData]);

  // Check approvals when settlement loads.
  useEffect(() => {
    if (settlement && !settlement.isSettled) {
      checkAllPartiesApproved();
    }
    // Use settlementId and isSettled flag instead of settlement object to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settlementId, settlement?.isSettled]);

  // Check if all approvals (both party and token level) are complete.
  useEffect(() => {
    if (settlement && !settlement.isSettled) {
      updateAllApprovalsComplete();
    }
    // Use settlementId and isSettled flag instead of settlement object to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settlementId, settlement?.isSettled]);

  return {
    settlementId,
    isLoading,
    isRefreshing,
    isManualRefreshing,
    settlement,
    formattedFlows,
    partyStatus,
    error,
    allPartiesApproved,
    allApprovalsComplete,
    isParticipant,
    walletClient,
    address,
    isConnected,
    refreshData,
    manualRefresh,
  };
}

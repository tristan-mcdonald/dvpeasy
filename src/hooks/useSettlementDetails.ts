import toast from 'react-hot-toast';
import { errorManager } from '../lib/error-manager';
import { settlements } from '../lib/settlements';
import { useAccount, useWalletClient } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePartyStatuses } from './usePartyStatuses';
import { useSettlement } from './useSettlement';

/**
 * Everything the settlement details page shows about the settlement in its URL, and a `refresh`
 * which reads it all again.
 */
export function useSettlementDetails () {
  const { settlementId } = useParams();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    settlement,
    flowsForDisplay,
    isLoading,
    error,
    refetch: refetchSettlement,
  } = useSettlement(settlementId);

  const {
    partyStatuses,
    hasLoaded: hasLoadedPartyStatuses,
    currentPartyStatus,
    allApprovalsComplete,
    refetch: refetchPartyStatuses,
  } = usePartyStatuses({ settlementId, settlement, address });

  useEffect(() => {
    if (error) toast.error(errorManager.formatUserMessage(error));
  }, [error]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchSettlement(), refetchPartyStatuses()]);
    setIsRefreshing(false);
  }, [refetchSettlement, refetchPartyStatuses]);

  return {
    settlementId,
    settlement,
    flowsForDisplay,
    isLoading,
    error,
    isRefreshing,
    refresh,
    partyStatuses,
    hasLoadedPartyStatuses,
    currentPartyStatus,
    allApprovalsComplete,
    isExpired: settlement ? settlements.isExpired(settlement) : false,
    isParticipant: Boolean(settlement && address && settlements.isParticipant(settlement, address)),
    address,
    isConnected,
    walletClient,
  };
}

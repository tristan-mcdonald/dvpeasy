import { Settlement } from '../../../types/settlement';
import { UseDashboardState } from './useDashboardState';
import { useMemo } from 'react';
import { useSettlementsByWallet } from '../../../hooks/useSettlementsByWallet';
import { useSettlementsWithFlows } from '../../../hooks/useSettlementsWithFlows';

export interface DashboardData {
  settlements: Settlement[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  totalSettlements?: number;
}

export function useDashboardData (dashboardState: UseDashboardState): DashboardData {
  const { tokenFilter, settlementIdFilter } = dashboardState.state;
  const { isWalletFiltering, isSettlementIdFiltering } = dashboardState.derived;

  // Use different hooks based on whether filtering is active.
  const flowsData = useSettlementsWithFlows(100, tokenFilter);
  const walletData = useSettlementsByWallet(100);

  // Choose the appropriate data source.
  const { settlements: rawSettlements, isLoading, isError, refetch } = (() => {
    if (isWalletFiltering) {
      return walletData;
    } else {
      return { ...flowsData, settlements: flowsData.settlements };
    }
  })();

  // Apply settlement ID filtering on the results.
  const settlements = useMemo(() => {
    if (!isSettlementIdFiltering) {
      return rawSettlements;
    }
    return rawSettlements.filter(settlement =>
      settlement.id.includes(settlementIdFilter.trim()),
    );
  }, [rawSettlements, isSettlementIdFiltering, settlementIdFilter]);

  return {
    settlements,
    isLoading,
    isError,
    refetch,
    totalSettlements: flowsData.totalSettlements,
  };
}

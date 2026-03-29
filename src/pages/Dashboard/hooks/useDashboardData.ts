import { Settlement } from '../../../types/settlement';
import { UseDashboardState } from './useDashboardState';
import { useMemo } from 'react';
import { useSettlementsByWallet } from '../../../hooks/useSettlementsByWallet';
import { useSettlementsWithFlows } from '../../../hooks/useSettlementsWithFlows';
import { useContractConfig } from '../../../hooks/useContractConfig';

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
  const { isConfigReady } = useContractConfig();

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

  // Show loading state if config isn't ready (network switching).
  const isLoadingWithConfig = isLoading || !isConfigReady;

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
    isLoading: isLoadingWithConfig,
    isError,
    refetch,
    totalSettlements: flowsData.totalSettlements,
  };
}

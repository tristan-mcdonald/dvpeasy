import { SettlementWithFlows } from '../../../types/settlement';
import { UseDashboardState } from './useDashboardState';
import { useMemo } from 'react';
import { useSettlementList } from '../../../hooks/useSettlementList';

export interface DashboardData {
  settlements: SettlementWithFlows[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  totalSettlements: number;
}

export function useDashboardData (dashboardState: UseDashboardState): DashboardData {
  const { tokenFilter, settlementIdFilter } = dashboardState.state;
  const { isWalletFiltering, isTokenFiltering, isSettlementIdFiltering } = dashboardState.derived;
  const { settlements: allSettlements, isLoading, isError, refetch } = useSettlementList({ isWalletFiltering });

  const settlements = useMemo(() => {
    const token = tokenFilter.toLowerCase();
    const settlementId = settlementIdFilter.trim();

    return allSettlements.filter(settlement => (
      (!isTokenFiltering || isWalletFiltering || settlement.flows.some(flow => flow.token.toLowerCase() === token)) &&
      (!isSettlementIdFiltering || settlement.id.includes(settlementId))
    ));
  }, [allSettlements, tokenFilter, settlementIdFilter, isTokenFiltering, isWalletFiltering, isSettlementIdFiltering]);

  return {
    settlements,
    isLoading,
    isError,
    refetch,
    totalSettlements: allSettlements.length,
  };
}

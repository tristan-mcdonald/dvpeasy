import { Settlement } from '../../../types/settlement';
import { UseDashboardState } from './useDashboardState';
import { useMemo } from 'react';
import { useSettlementList } from '../../../hooks/useSettlementList';

export interface DashboardData {
  settlements: Settlement[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  totalSettlements: number;
}

/**
 * The settlements the dashboard lists, filtered by token and ID. The wallet filter is applied when
 * they're read, since it reads a different list.
 */
export function useDashboardData (dashboardState: UseDashboardState): DashboardData {
  const { tokenFilter, settlementIdFilter } = dashboardState.state;
  const { isWalletFiltering, isTokenFiltering, isSettlementIdFiltering } = dashboardState.derived;
  const { settlements: allSettlements, isLoading, isError, refetch } = useSettlementList({ isWalletFiltering });

  const settlements = useMemo(() => {
    const token = tokenFilter.toLowerCase();
    const settlementId = settlementIdFilter.trim();

    return allSettlements.filter(settlement => (
      (!isTokenFiltering || settlement.flows.some(flow => flow.token.toLowerCase() === token)) &&
      (!isSettlementIdFiltering || settlement.id.includes(settlementId))
    ));
  }, [allSettlements, tokenFilter, settlementIdFilter, isTokenFiltering, isSettlementIdFiltering]);

  return {
    settlements,
    isLoading,
    isError,
    refetch,
    totalSettlements: allSettlements.length,
  };
}

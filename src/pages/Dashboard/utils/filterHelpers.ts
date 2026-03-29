import { UseDashboardState } from '../hooks/useDashboardState';

export function getFilterResultsText (
  filters: UseDashboardState,
  settlementCount: number,
  totalSettlements?: number,
): string {
  const { isWalletFiltering, isTokenFiltering, isSettlementIdFiltering } = filters.derived;

  const settlementText = `${settlementCount} settlement${settlementCount !== 1 ? 's' : ''}`;

  let conditionText = '';

  if (isWalletFiltering && isTokenFiltering && isSettlementIdFiltering) {
    conditionText = ' involving your wallet, this token, and matching the ID';
  } else if (isWalletFiltering && isTokenFiltering) {
    conditionText = ' involving your wallet and this token';
  } else if (isWalletFiltering && isSettlementIdFiltering) {
    conditionText = ' involving your wallet and matching the ID';
  } else if (isTokenFiltering && isSettlementIdFiltering) {
    conditionText = ' involving this token and matching the ID';
  } else if (isWalletFiltering) {
    conditionText = ' involving your wallet';
  } else if (isTokenFiltering) {
    conditionText = ' involving this token';
  } else {
    conditionText = ' matching the ID';
  }

  const totalText = isTokenFiltering && totalSettlements
    ? ` of ${totalSettlements} total settlement${totalSettlements !== 1 ? 's' : ''}`
    : '';

  return `Showing ${settlementText}${conditionText}${totalText}`;
}

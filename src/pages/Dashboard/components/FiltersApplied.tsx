import { UseDashboardState } from '../hooks/useDashboardState';
import { useTokenSymbol } from '../hooks/useTokenSymbol';
import { X } from 'lucide-react';

interface FilterBadgesProps {
  filters: UseDashboardState;
}

export default function FilterBadges ({ filters }: FilterBadgesProps) {
  const { isTokenFiltering, isSettlementIdFiltering, isWalletFiltering, hasActiveFilters } = filters.derived;
  const { tokenSymbol } = useTokenSymbol(filters.state.tokenFilter);

  if (!hasActiveFilters) {
    return null;
  }

  const classNamesButton = 'transition-colors flex items-center gap-1 rounded border border-interface-border bg-card-background hover:bg-white pl-2 pr-2.5 leading-6 text-sm';
  const classNamesIcon = 'size-4 text-error';

  return (
    <div className="flex items-center justify-end flex-wrap gap-2">
      {isTokenFiltering && (
        <button
        className={classNamesButton}
        aria-label="Clear token"
        onClick={filters.clearTokenFilter}>
          <X className={classNamesIcon} />
          <span>{tokenSymbol || 'Token'}</span>
        </button>
      )}

      {isSettlementIdFiltering && (
        <button
        className={classNamesButton}
        aria-label="Clear ID"
        onClick={filters.clearSettlementIdFilter}>
          <X className={classNamesIcon} />
          <span>ID #{filters.state.settlementIdFilter}</span>
        </button>
      )}

      {isWalletFiltering && (
        <button
        className={classNamesButton}
        aria-label="Clear my settlements"
        onClick={filters.clearWalletFilter}>
          <X className={classNamesIcon} />
          <span>My settlements only</span>
        </button>
      )}

      <button
      className={classNamesButton}
      aria-label="Clear all filters"
      onClick={filters.clearAllFilters}>
        <X className={classNamesIcon} />
        <span>Clear all filters</span>
      </button>
    </div>
  );
}

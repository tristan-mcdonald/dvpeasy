import { getFilterResultsText } from '../utils/filterHelpers';
import { Settlement } from '../../../types/settlement';
import { TokenSelect } from '../../../components/scaffold-eth/TokenSelect';
import { UseDashboardState } from '../hooks/useDashboardState';
import { useSettlementsByWallet } from '../../../hooks/useSettlementsByWallet';
import { X } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: UseDashboardState;
  settlements: Settlement[];
  totalSettlements?: number;
}

export default function FilterDrawer ({
  isOpen,
  onClose,
  filters,
  settlements,
  totalSettlements,
}: FilterDrawerProps) {
  const walletData = useSettlementsByWallet(100);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
      className="fixed inset-0 bg-black/50 transition-opacity duration-300"
      onClick={onClose}/>

      <aside
      className="fixed top-0 right-0 h-full w-full max-w-xl bg-card-background shadow-xl space-y-8 p-6"
      role="dialog"
      style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      tabIndex={-1}>
        <div className="flex items-center justify-between w-full border-b mb-8 border-interface-border pb-6">
          <h2>Filters</h2>
          <button
          aria-label="Close filters"
          className="transition-colors text-primary-subtle hover:text-primary"
          onClick={onClose}
          type="button">
            <X className="size-6" />
          </button>
        </div>

        <div className="space-y-8 !mt-0">
          <div>
            <TokenSelect
            label="Token address"
            onChange={filters.setTokenFilter}
            placeholder="0x… (or leave empty to show all settlements)"
            value={filters.state.tokenFilter}/>
          </div>

          <div>
            <label className="block label mb-2">Settlement ID</label>
            <input
            className="input-standard"
            onChange={(event) => filters.setSettlementIdFilter(event.target.value)}
            placeholder="Enter settlement ID"
            type="text"
            value={filters.state.settlementIdFilter}/>
          </div>

          {walletData.isWalletConnected && (
            <div className="flex items-center gap-1.5">
              <input
              className="switch switch-primary"
              checked={filters.state.walletFilter}
              id="walletFilterSwitch"
              onChange={(event) => filters.setWalletFilter(event.target.checked)}
              type="checkbox"/>
              <label
              className="label-text"
              htmlFor="walletFilterSwitch">Show my settlements only</label>
            </div>
          )}

          {filters.derived.hasActiveFilters && (
            <div className="text-sm text-text-label">
              {getFilterResultsText(filters, settlements.length, totalSettlements)}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

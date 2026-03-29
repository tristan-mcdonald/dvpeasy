import FiltersApplied from './FiltersApplied';
import { chainManager } from '../../../lib/chain-manager';
import { ExternalLink, SlidersHorizontal } from 'lucide-react';
import { useAppKitNetworkState } from '../../../hooks/useAppKitNetwork';
import { useContractAddresses } from '../../../hooks/useContractConfig';
import { UseDashboardState } from '../hooks/useDashboardState';

interface DashboardHeaderProps {
  onShowFilters: () => void;
  filters: UseDashboardState;
}

export default function DashboardHeader ({ onShowFilters, filters }: DashboardHeaderProps) {
  const { chainId } = useAppKitNetworkState();
  const { dvpAddress } = useContractAddresses();
  const blockExplorerUrl = chainId ? chainManager.blockExplorerAddressUrl(chainId, dvpAddress) : undefined;

  return (
    <div className="space-y-2 max-w-full w-full">
      <div className="flex items-center justify-between gap-2 max-w-full w-full">

        {/* View all transactions on blockchain explorer link */}
        <a
        className="transition-colors flex items-center gap-2"
        href={blockExplorerUrl}
        rel="noopener noreferrer"
        target="_blank">
          <ExternalLink className="size-4 text-primary-subtle" />
          <span className="link link-animated link-primary">View all transactions on this smart contract</span>
        </a>

        {/* Filters open button */}
        <button
        className="transition-colors flex items-center gap-2"
        aria-label="Show filters"
        onClick={onShowFilters}
        type="button">
          <SlidersHorizontal className="size-4 text-primary-subtle" />
          <span className="link link-animated link-primary">Show filters</span>
        </button>

      </div>

      {/* Applied filters */}
      <FiltersApplied filters={filters} />

    </div>
  );
}

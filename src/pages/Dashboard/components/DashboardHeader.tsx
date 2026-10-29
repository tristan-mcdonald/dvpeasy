import FiltersApplied from './FiltersApplied';
import { networkLinks } from '../../../lib/network-links';
import { ExternalLink, SlidersHorizontal } from 'lucide-react';
import { useCurrentNetwork } from '../../../hooks/useCurrentNetwork';
import { UseDashboardState } from '../hooks/useDashboardState';

interface DashboardHeaderProps {
  onShowFilters: () => void;
  filters: UseDashboardState;
}

/**
 * Above the dashboard's table: a link to the DVP contract in the block explorer, the button which
 * opens the filters, and the filters applied.
 */
export default function DashboardHeader ({ onShowFilters, filters }: DashboardHeaderProps) {
  const { deployment, network } = useCurrentNetwork();
  const blockExplorerUrl = networkLinks.address(network.chainId, deployment.dvpAddress);

  return (
    <div className="space-y-2 max-w-full w-full">
      <div className="flex items-center justify-between gap-2 max-w-full w-full">

        <a
        className="transition-colors flex items-center gap-2"
        href={blockExplorerUrl}
        rel="noopener noreferrer"
        target="_blank">
          <ExternalLink className="size-4 text-primary-subtle" />
          <span className="link link-animated link-primary">View all transactions on this smart contract</span>
        </a>

        <button
        className="transition-colors flex items-center gap-2"
        aria-label="Show filters"
        onClick={onShowFilters}
        type="button">
          <SlidersHorizontal className="size-4 text-primary-subtle" />
          <span className="link link-animated link-primary">Show filters</span>
        </button>

      </div>

      <FiltersApplied filters={filters} />

    </div>
  );
}

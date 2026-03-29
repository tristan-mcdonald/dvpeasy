import ButtonLink from '../../../components/ButtonLink';
import Pagination from '../../../components/Pagination';
import SettlementTable from '../../../components/SettlementTable';
import { contractConfigManager } from '../../../config/contracts';
import { Plus } from 'lucide-react';
import { Settlement } from '../../../types/settlement';
import { urlManager } from '../../../lib/url-manager';
import { UseDashboardState } from '../hooks/useDashboardState';

interface DashboardContentProps {
  settlements: Settlement[];
  pagination: UseDashboardState;
  filters: UseDashboardState;
}

export default function DashboardContent ({
  settlements,
  pagination,
  filters,
}: DashboardContentProps) {
  const { currentData, validCurrentPage } = pagination.getPaginatedData(settlements);

  // Get current network and version for create settlement URL.
  const getCurrentCreateUrl = () => {
    const currentConfig = contractConfigManager.getCurrentConfig();
    const currentVersion = contractConfigManager.getCurrentVersion();
    return urlManager.buildCreateUrl(currentConfig.networkId, currentVersion);
  };

  if (settlements.length === 0) {
    return (
      <div className="flex justify-between items-center gap-4 p-4 shadow-standard bg-card-background border border-interface-border rounded-lg">
        <p>
          {filters.derived.hasActiveFilters
            ? 'No settlements found matching the current filters.'
            : 'There are currently no settlements in the system.'}
        </p>
        <ButtonLink
        as="link"
        icon={<Plus className="size-5" />}
        to={getCurrentCreateUrl()}
        variant="primary">Create settlement</ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 min-w-0">
      <SettlementTable settlements={currentData} />
      <div className="w-full flex justify-between">
        <Pagination
        currentPage={validCurrentPage}
        itemsPerPage={pagination.state.settlementsPerPage}
        onPageChange={pagination.handlePageChange}
        totalItems={settlements.length}/>
        <ButtonLink
        className="ml-auto"
        as="link"
        icon={<Plus className="size-5" />}
        to={getCurrentCreateUrl()}
        variant="primary">Create settlement</ButtonLink>
      </div>
    </div>
  );
}

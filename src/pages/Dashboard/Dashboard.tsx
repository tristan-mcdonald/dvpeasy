import DashboardContent from './components/DashboardContent';
import DashboardErrorState from './components/DashboardErrorState';
import DashboardHeader from './components/DashboardHeader';
import DashboardLoadingState from './components/DashboardLoadingState';
import FilterDrawer from './components/FilterDrawer';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';
import { useDashboardData } from './hooks/useDashboardData';
import { useDashboardState } from './hooks/useDashboardState';
import { useEffect } from 'react';

export default function Dashboard () {
  const dashboardState = useDashboardState();
  const { settlements, isLoading, isError, refetch, totalSettlements } = useDashboardData(dashboardState);

  useBodyScrollLock(dashboardState.state.isDrawerOpen);

  const { totalPages } = dashboardState.getPaginatedData(settlements);
  const { currentPage } = dashboardState.state;
  const { handlePageChange } = dashboardState;

  // Reset to page 1 if current page exceeds total pages.
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      handlePageChange(1);
    }
  }, [currentPage, totalPages, handlePageChange]);

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (isError) {
    return <DashboardErrorState onRetry={refetch} />;
  }

  return (
    <div className="grid gap-6">
      <DashboardHeader
      filters={dashboardState}
      onShowFilters={() => dashboardState.setDrawerOpen(true)}/>

      <FilterDrawer
      filters={dashboardState}
      isOpen={dashboardState.state.isDrawerOpen}
      onClose={() => dashboardState.setDrawerOpen(false)}
      settlements={settlements}
      totalSettlements={totalSettlements}/>

      <DashboardContent
      filters={dashboardState}
      pagination={dashboardState}
      settlements={settlements}/>
    </div>
  );
}

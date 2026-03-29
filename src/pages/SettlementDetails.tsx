import HeaderLocal from '../components/HeaderLocal';
import SettlementActions from '../components/SettlementActions';
import SettlementApprovals from '../components/SettlementApprovals';
import SettlementFlows from '../components/SettlementFlows';
import SettlementGraph from '../components/SettlementGraph';
import SettlementHeader from '../components/SettlementHeader';
import SettlementOverview from '../components/SettlementOverview';
import { urlManager } from '../lib/url-manager';
import { Loader2 } from 'lucide-react';
import { useApprovalEvents } from '../hooks/useApprovalEvents';
import { useCallback, useEffect, useMemo } from 'react';
import { useContractConfig } from '../hooks/useContractConfig';
import { useNavigate } from 'react-router-dom';
import { useSettlementActions } from '../hooks/useSettlementActions';
import { useSettlementApprovalStatus } from '../hooks/useSettlementApprovalStatus';
import { useSettlementDetails } from '../hooks/useSettlementDetails';
import { useTokenMetadata } from '../hooks/useTokenMetadata';

export default function SettlementDetails () {
  const navigate = useNavigate();
  const { config } = useContractConfig();

  const {
    settlementId,
    isLoading,
    isManualRefreshing,
    settlement,
    formattedFlows,
    partyStatus,
    error,
    allApprovalsComplete,
    isParticipant,
    walletClient,
    address,
    isConnected,
    refreshData,
    manualRefresh,
  } = useSettlementDetails();

  /**
   * Create a stable reference for flows to prevent useTokenMetadata from re-running when only
   * settlement status changes but flows remain the same.
   */
  const flowsForTokenMetadata = useMemo(() => {
    if (!settlement?.flows) return undefined;
    // Only extract the token addresses that useTokenMetadata actually needs.
    return settlement.flows.map(flow => ({ token: flow.token }));
  }, [settlement?.flows]);

  const tokenMetadata = useTokenMetadata(flowsForTokenMetadata);


  const { approvalEvents, refetchApprovalEvents } = useApprovalEvents(settlementId);

  const {
    partyStatuses,
    isLoading: isLoadingApprovalStatus,
    hasEverLoaded: hasEverLoadedApprovalStatus,
    error: approvalStatusError,
    refetch: refetchApprovalStatus,
  } = useSettlementApprovalStatus(settlementId, settlement);

  const handleRefresh = useCallback(async () => {
    await manualRefresh();
    await refetchApprovalEvents();
    await refetchApprovalStatus();
  }, [manualRefresh, refetchApprovalEvents, refetchApprovalStatus]);

  const handleActionSuccess = useCallback(async () => {
    await refreshData();
    await refetchApprovalStatus();
  }, [refreshData, refetchApprovalStatus]);

  const {
    isApproving,
    isExecuting,
    isRevoking,
    isWithdrawing,
    approvingToken,
    handleApprove,
    handleExecuteSettlement,
    handleApproveToken,
    handleMaxApprove,
    handleRevokeApproval,
    handleWithdrawETH,
  } = useSettlementActions({
    settlementId,
    address,
    walletClient,
    partyStatus,
    onSuccess: handleActionSuccess,
  });

  // Auto-redirect to dashboard if settlement is not found after loading completes.
  useEffect(() => {
    if (!isLoading && error && !settlement) {
      // Wait a brief moment to show the error, then redirect.
      const timer = setTimeout(() => {
        const dashboardUrl = urlManager.buildDashboardUrl(config.networkId, config.currentVersion);
        navigate(dashboardUrl, { replace: true });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, error, settlement, config.networkId, config.currentVersion, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center mt-auto mb-auto min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <HeaderLocal
      centerVertically={true}
      description={`${typeof error === 'string' ? error : error?.message || 'A settlement with that ID was not found; are you on the correct network?'}`}
      title="Settlement not found" />
    );
  }

  const cutoffDate = new Date(Number(settlement.cutoffDate) * 1000);
  const isExpired = cutoffDate.getTime() < Date.now();

  return (
    <div className="mx-auto w-full">
      <SettlementHeader
      isRefreshing={isManualRefreshing}
      onRefresh={handleRefresh}
      settlementId={settlementId}
      settlementReference={settlement.settlementReference} />
      <div className="space-y-8">
        <SettlementOverview settlement={settlement} />
        <SettlementFlows
        formattedFlows={formattedFlows}
        tokenMetadata={tokenMetadata}
        walletClient={walletClient} />
        <SettlementGraph
        flows={formattedFlows}
        tokenMetadata={tokenMetadata} />
        <SettlementApprovals
        approvalEvents={approvalEvents}
        approvingToken={approvingToken}
        currentUserAddress={address}
        error={approvalStatusError}
        flows={settlement.flows}
        hasEverLoaded={hasEverLoadedApprovalStatus}
        isExpired={isExpired}
        isLoading={isLoadingApprovalStatus}
        isRevoking={isRevoking}
        isSettled={settlement.isSettled}
        isWithdrawing={isWithdrawing}
        onApproveToken={handleApproveToken}
        onMaxApprove={handleMaxApprove}
        onRevokeApproval={handleRevokeApproval}
        onWithdrawETH={handleWithdrawETH}
        partyStatuses={partyStatuses}/>
        <SettlementActions
        allPartiesApproved={allApprovalsComplete}
        isApproving={isApproving}
        isConnected={isConnected}
        isExecuting={isExecuting}
        isExpired={isExpired}
        isParticipant={isParticipant}
        isSettled={settlement.isSettled}
        onApprove={handleApprove}
        onExecute={handleExecuteSettlement}
        partyStatus={partyStatus} />
      </div>
    </div>
  );
}

import HeaderLocal from '../components/HeaderLocal';
import SettlementActions from '../components/SettlementActions';
import SettlementApprovals from '../components/SettlementApprovals';
import SettlementFlows from '../components/SettlementFlows';
import SettlementGraph from '../components/SettlementGraph';
import SettlementHeader from '../components/SettlementHeader';
import SettlementOverview from '../components/SettlementOverview';
import { urlManager } from '../lib/url-manager';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useCurrentNetwork } from '../hooks/useCurrentNetwork';
import { useNavigate } from 'react-router-dom';
import { useSettlementActions } from '../hooks/useSettlementActions';
import { useSettlementDetails } from '../hooks/useSettlementDetails';
import { useTokenMetadata } from '../hooks/useTokenMetadata';

export default function SettlementDetails () {
  const navigate = useNavigate();
  const { deployment, network } = useCurrentNetwork();

  const {
    settlementId,
    settlement,
    formattedFlows,
    isLoading,
    error,
    isRefreshing,
    refresh,
    partyStatuses,
    hasLoadedPartyStatuses,
    currentPartyStatus,
    allApprovalsComplete,
    isExpired,
    isParticipant,
    address,
    isConnected,
    walletClient,
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
    partyStatus: currentPartyStatus,
    onSuccess: refresh,
  });

  // Auto-redirect to dashboard if settlement is not found after loading completes.
  useEffect(() => {
    if (!isLoading && error && !settlement) {
      // Wait a brief moment to show the error, then redirect.
      const timer = setTimeout(() => {
        const dashboardUrl = urlManager.buildDashboardUrl(network.id, deployment.version.tag);
        navigate(dashboardUrl, { replace: true });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, error, settlement, network.id, deployment.version.tag, navigate]);

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

  return (
    <div className="mx-auto w-full">
      <SettlementHeader
      isRefreshing={isRefreshing}
      onRefresh={refresh}
      settlementId={settlementId}
      settlementReference={settlement.settlementReference} />
      <div className="space-y-8">
        <SettlementOverview settlement={settlement} />
        <SettlementFlows
        formattedFlows={formattedFlows}
        tokenMetadata={tokenMetadata} />
        <SettlementGraph
        flows={formattedFlows}
        tokenMetadata={tokenMetadata} />
        <SettlementApprovals
        approvingToken={approvingToken}
        currentUserAddress={address}
        flows={settlement.flows}
        hasEverLoaded={hasLoadedPartyStatuses}
        isExpired={isExpired}
        isLoading={isRefreshing}
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
        partyStatus={currentPartyStatus} />
      </div>
    </div>
  );
}

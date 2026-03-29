import ErrorBoundary from '../ErrorBoundary';
import HeadingAndTotal from '../HeadingAndTotal';
import PartyApprovalCard from './PartyApprovalCard';
import { Loader2, X } from 'lucide-react';
import { ReactNode } from 'react';
import { SettlementApprovalsProps } from './types';
import { useFilteredParties } from './hooks/useFilteredParties';
import { useLoadingState } from './hooks/useLoadingState';

const CardContainer = ({ children }: { children: ReactNode }) => (
  <div className="block w-full shadow-standard rounded-lg bg-input-background border border-input-border p-4 space-y-4">
    {children}
  </div>
);

export default function SettlementApprovals ({
  partyStatuses,
  isLoading,
  hasEverLoaded,
  error,
  isExpired,
  isSettled,
  onApproveToken,
  onMaxApprove,
  currentUserAddress,
  approvingToken,
  approvalEvents,
  flows,
  onRevokeApproval,
  onWithdrawETH,
  isRevoking,
  isWithdrawing,
}: SettlementApprovalsProps) {
  const { shouldShowLoadingState, isInitialLoad } = useLoadingState(
    isLoading,
    hasEverLoaded,
    partyStatuses,
  );

  const filteredPartyStatuses = useFilteredParties(partyStatuses);

  if (error) {
    return (
      <CardContainer>
        <div className="flex items-center gap-2 mb-4">
          <X className="size-5 text-error" />
          <h2>Settlement approval status</h2>
        </div>
        <p className="text-error">{String(error)}</p>
      </CardContainer>
    );
  }

  return (
    <div className="space-y-4 last:pb-12">
      <HeadingAndTotal
      count={filteredPartyStatuses.length}
      heading="Settlement approval status"
      singularName="party"
      pluralName="parties" />
      <div className="fade-container">
        {/* Loading spinner that fades in when loading. */}
        <div className={`fade-loading ${shouldShowLoadingState ? 'fade-in' : ''} ${isInitialLoad ? 'initial-load' : ''}`}>
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm text-text-label">Loading approval statuses…</span>
          </div>
        </div>

        {/* Content that fades out when loading. */}
        <div className={`fade-content ${shouldShowLoadingState ? 'fade-out' : ''} ${isInitialLoad ? 'initial-load' : ''}`}>
          <div className="space-y-4">
            {filteredPartyStatuses.length === 0 && !shouldShowLoadingState ? (
              <div className="block w-full shadow-standard rounded-lg bg-input-background border border-input-border p-4 space-y-4 text-center">
                <span>No parties found in this settlement.</span>
              </div>
            ) : (
              <>
                {filteredPartyStatuses.map((partyStatus) => (
                  <ErrorBoundary
                  description="There was an error loading this party's approval status. Other parties may still be visible."
                  fallback={
                    <div className="block w-full shadow-standard rounded-lg bg-input-background border border-input-border p-4">
                      <p className="text-error text-sm">Error loading approval status for party {partyStatus.address.slice(0, 6)}…{partyStatus.address.slice(-4)}</p>
                    </div>
                  }
                  key={partyStatus.address}
                  showHomeButton={false}
                  showRefreshButton={false}
                  title="Party approval error">
                    <PartyApprovalCard
                    approvingToken={approvingToken}
                    approvalEvents={approvalEvents}
                    currentUserAddress={currentUserAddress}
                    flows={flows}
                    isExpired={isExpired}
                    isRevoking={isRevoking}
                    isSettled={isSettled}
                    isWithdrawing={isWithdrawing}
                    onApproveToken={onApproveToken}
                    onMaxApprove={onMaxApprove}
                    onRevokeApproval={onRevokeApproval}
                    onWithdrawETH={onWithdrawETH}
                    partyStatus={partyStatus} />
                  </ErrorBoundary>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

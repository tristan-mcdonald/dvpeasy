import ErrorBoundary from '../ErrorBoundary';
import HeadingAndTotal from '../HeadingAndTotal';
import PartyApprovalCard from './PartyApprovalCard';
import { Address } from 'viem';
import { Loader2 } from 'lucide-react';
import { PartyStatusForDisplay } from '../../types/settlement';
import { useFilteredParties } from './hooks/useFilteredParties';
import { utilityManager } from '../../lib/utils';

interface SettlementApprovalsProps {
  partyStatuses: PartyStatusForDisplay[];
  isLoading: boolean;
  hasEverLoaded: boolean;
  isExpired: boolean;
  isSettled: boolean;
  onApproveToken: (tokenAddress: string, amount: bigint) => void;
  onMaxApprove: (tokenAddress: string) => void;
  currentUserAddress: Address | undefined;
  approvingToken: string | null;
  onRevokeApproval?: () => void;
  onWithdrawETH?: () => void;
  isRevoking?: boolean;
  isWithdrawing?: boolean;
}

export default function SettlementApprovals ({
  partyStatuses,
  isLoading,
  hasEverLoaded,
  isExpired,
  isSettled,
  onApproveToken,
  onMaxApprove,
  currentUserAddress,
  approvingToken,
  onRevokeApproval,
  onWithdrawETH,
  isRevoking,
  isWithdrawing,
}: SettlementApprovalsProps) {
  const isInitialLoad = !hasEverLoaded;
  const shouldShowLoadingState = isLoading || isInitialLoad;

  const filteredPartyStatuses = useFilteredParties(partyStatuses);

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
                      <p className="text-error text-sm">Error loading approval status for party {utilityManager.shortenAddress(partyStatus.address)}</p>
                    </div>
                  }
                  key={partyStatus.address}
                  showHomeButton={false}
                  showRefreshButton={false}
                  title="Party approval error">
                    <PartyApprovalCard
                    approvingToken={approvingToken}
                    currentUserAddress={currentUserAddress}
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

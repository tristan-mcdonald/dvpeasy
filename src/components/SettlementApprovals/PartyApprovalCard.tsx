import ApprovalStatusBadge from './ApprovalStatusBadge';
import EtherApprovalRow from './EtherApprovalRow';
import TokenApprovalRow from './TokenApprovalRow';
import Tooltip from '../Tooltip';
import { approvalEventsManager, ApprovalEvent } from '../../lib/approval-events';
import { Check, ExternalLink, Hourglass, Wallet, X } from 'lucide-react';
import { settlementManager } from './utils';
import { PartyApprovalStatus } from './types';
import { ReactNode } from 'react';

interface PartyApprovalCardProps {
  partyStatus: PartyApprovalStatus;
  currentUserAddress: string | undefined;
  approvingToken: string | null;
  isExpired: boolean;
  isSettled: boolean;
  onApproveToken: (tokenAddress: string, amount: bigint) => void;
  onMaxApprove: (tokenAddress: string) => void;
  approvalEvents: ApprovalEvent[];
  flows: Array<{ to: string; from: string }>;
  onRevokeApproval?: () => void;
  onWithdrawETH?: () => void;
  isRevoking?: boolean;
  isWithdrawing?: boolean;
}

const CardContainer = ({ children, isUserParty }: { children: ReactNode; isUserParty?: boolean }) => (
  <div className={`block w-full shadow-standard bg-input-background border border-input-border p-4 space-y-4 ${isUserParty ? 'shadow-[inset_3px_0_0_var(--color-primary)] rounded-r-lg' : 'rounded-lg'}`}>
    {children}
  </div>
);

const PartyHeader = ({ address }: { address: string }) => (
  <header>
    <span className="block label">Party</span>
    <span className="font-mono break-words">{address}</span>
  </header>
);

export default function PartyApprovalCard ({
  partyStatus,
  currentUserAddress,
  approvingToken,
  isExpired,
  isSettled,
  onApproveToken,
  onMaxApprove,
  approvalEvents,
  flows,
  onRevokeApproval,
  onWithdrawETH,
  isRevoking,
  isWithdrawing,
}: PartyApprovalCardProps) {
  const isUserParty = settlementManager.isCurrentUserParty(currentUserAddress, partyStatus.address);
  const classesIntroductionSection = 'flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-interface-border pb-4';

  if (partyStatus.error) {
    return (
      <CardContainer isUserParty={isUserParty}>
        <div className={classesIntroductionSection}>
          <PartyHeader address={partyStatus.address} />
          <div className="flex items-center gap-2">
            <X className="size-4 text-error" />
            <span className="text-sm text-error">Error loading data</span>
          </div>
        </div>
        <p className="text-sm text-error">{String(partyStatus.error)}</p>
      </CardContainer>
    );
  }

  const approvalStatus = settlementManager.approvalStatus(partyStatus, isExpired, isSettled);
  const approvalTransactionHash = settlementManager.approvalTransactionForParty(partyStatus.address, approvalEvents);
  const approvalTransactionUrl = approvalTransactionHash ? approvalEventsManager.transactionUrl(approvalTransactionHash) : undefined;

  return (
    <CardContainer isUserParty={isUserParty}>
      <div className={classesIntroductionSection}>
        <div>
          {isUserParty && (
            <div className="mb-2 badge badge-soft badge-primary">
              <Wallet className="size-4 text-primary" />
              <span className="block text-sm">You are currently connected to this address</span>
            </div>
          )}
          <PartyHeader address={partyStatus.address} />
        </div>
        <div className="flex flex-col sm:items-end gap-2.5">
          <ApprovalStatusBadge status={approvalStatus} />
          <div className="flex items-center gap-1.5">
            {partyStatus.isApproved ? (
              <Check className="size-4 text-success" />
            ) : isExpired ? (
              <X className="size-4 text-error" />
            ) : (
              <Hourglass className="size-4 text-warning" />
            )}
            <span className="block text-sm">
              {partyStatus.isApproved
                ? (isExpired ? 'Settlement was approved by party' : 'Settlement approved by party')
                : (isExpired ? 'Settlement was not approved by party' : 'Settlement awaiting approval by party')
              }
            </span>
            {partyStatus.isApproved && approvalTransactionUrl && (
              <Tooltip content="View this approval transaction on blockchain explorer">
                <a
                aria-label="View this approval transaction on blockchain explorer"
                className="transition-colours text-primary hover:text-primary-interact"
                href={approvalTransactionUrl}
                rel="noopener noreferrer"
                target="_blank">
                  <ExternalLink className="size-4" />
                </a>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {partyStatus.tokenStatuses.length === 0 && partyStatus.etherRequired === 0n ? (
        <div className="py-4 text-center">No tokens or ETH required for this party.</div>
      ) : (
        <div className="min-w-0 w-full overflow-x-auto">
          <table className="min-w-[640px] table table-sm table-borderless table-no-padding-inline w-full table-fixed">
            <thead>
              <tr>
                <th className="label normal-case w-1/4">Token</th>
                <th className="label normal-case w-1/4">Required</th>
                <th className="label normal-case w-1/4">Approved for settlement</th>
                <th className="label normal-case w-1/4">Approval complete</th>
              </tr>
            </thead>
            <tbody>
              <EtherApprovalRow
              approvalEvents={approvalEvents}
              currentUserAddress={currentUserAddress}
              flows={flows}
              isExpired={isExpired}
              isRevoking={isRevoking}
              isSettled={isSettled}
              isWithdrawing={isWithdrawing}
              onRevokeApproval={onRevokeApproval}
              onWithdrawETH={onWithdrawETH}
              partyStatus={partyStatus} />
              {partyStatus.tokenStatuses.map((tokenStatus, index) => (
                <TokenApprovalRow
                approvingToken={approvingToken}
                approvalEvents={approvalEvents}
                currentUserAddress={currentUserAddress}
                isExpired={isExpired}
                isSettled={isSettled}
                key={`${tokenStatus.tokenAddress}-${index}`}
                onApproveToken={onApproveToken}
                onMaxApprove={onMaxApprove}
                partyStatus={partyStatus}
                tokenStatus={tokenStatus} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContainer>
  );
}

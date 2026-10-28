import ApprovalStatusBadge from './ApprovalStatusBadge';
import EtherApprovalRow from './EtherApprovalRow';
import TokenApprovalRow from './TokenApprovalRow';
import { Address, isAddressEqual } from 'viem';
import { Check, Hourglass, Wallet, X } from 'lucide-react';
import { PartyStatusForDisplay } from '../../types/settlement';
import { ReactNode } from 'react';
import { settlementManager } from './utils';

interface PartyApprovalCardProps {
  partyStatus: PartyStatusForDisplay;
  currentUserAddress: Address | undefined;
  approvingToken: string | null;
  isExpired: boolean;
  isSettled: boolean;
  onApproveToken: (tokenAddress: string, amount: bigint) => void;
  onMaxApprove: (tokenAddress: string) => void;
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
  onRevokeApproval,
  onWithdrawETH,
  isRevoking,
  isWithdrawing,
}: PartyApprovalCardProps) {
  const isUserParty = currentUserAddress !== undefined && isAddressEqual(currentUserAddress, partyStatus.address);
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
              isExpired={isExpired}
              isRevoking={isRevoking}
              isSettled={isSettled}
              isUserParty={isUserParty}
              isWithdrawing={isWithdrawing}
              onRevokeApproval={onRevokeApproval}
              onWithdrawETH={onWithdrawETH}
              partyStatus={partyStatus} />
              {partyStatus.tokenStatuses.map((tokenStatus, index) => (
                <TokenApprovalRow
                approvingToken={approvingToken}
                isExpired={isExpired}
                isSettled={isSettled}
                isUserParty={isUserParty}
                key={`${tokenStatus.tokenAddress}-${index}`}
                onApproveToken={onApproveToken}
                onMaxApprove={onMaxApprove}
                tokenStatus={tokenStatus} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContainer>
  );
}

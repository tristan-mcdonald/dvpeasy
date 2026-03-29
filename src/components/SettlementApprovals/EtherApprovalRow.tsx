import ApprovalStatusIcon from './ApprovalStatusIcon';
import RevokeApprovalButton from './RevokeApprovalButton';
import Tooltip from '../Tooltip';
import WithdrawEtherButton from './WithdrawEtherButton';
import { approvalEventsManager, ApprovalEvent } from '../../lib/approval-events';
import { ExternalLink } from 'lucide-react';
import { formatUnits } from 'viem';
import { settlementManager } from './utils';
import { PartyApprovalStatus } from './types';
import { TokenLogo } from '../TokenLogo';

interface EtherApprovalRowProps {
  partyStatus: PartyApprovalStatus;
  isExpired: boolean;
  isSettled: boolean;
  approvalEvents: ApprovalEvent[];
  currentUserAddress: string | undefined;
  flows: Array<{ to: string; from: string }>;
  onRevokeApproval?: () => void;
  onWithdrawETH?: () => void;
  isRevoking?: boolean;
  isWithdrawing?: boolean;
}

export default function EtherApprovalRow ({
  partyStatus,
  isExpired,
  isSettled,
  approvalEvents,
  currentUserAddress,
  flows,
  onRevokeApproval,
  onWithdrawETH,
  isRevoking = false,
  isWithdrawing = false,
}: EtherApprovalRowProps) {
  if (partyStatus.etherRequired === 0n) return null;

  const hasEnoughEther = partyStatus.etherDeposited >= partyStatus.etherRequired;
  const formattedRequired = formatUnits(partyStatus.etherRequired, 18);
  const formattedDeposited = formatUnits(partyStatus.etherDeposited, 18);

  // When settlement is settled, show the required amount as the approved amount since funds were transferred.
  const displayedApprovedAmount = isSettled ? formattedRequired : formattedDeposited;

  const approvalTransactionHash = settlementManager.approvalTransactionForParty(partyStatus.address, approvalEvents);
  const approvalTransactionUrl = approvalTransactionHash ? approvalEventsManager.transactionUrl(approvalTransactionHash) : undefined;

  const isUserParty = settlementManager.isCurrentUserParty(currentUserAddress, partyStatus.address);
  const isInvolved = settlementManager.isPartyInvolved(partyStatus.address, flows);
  const canShowRevokeButton = isUserParty && isInvolved && partyStatus.isApproved && !isExpired && !isSettled && onRevokeApproval;
  const canShowWithdrawButton = isUserParty && isInvolved && partyStatus.isApproved && isExpired && !isSettled && partyStatus.etherDeposited > 0n && onWithdrawETH;

  return (
    <tr>
      <td className="break-words wrap-anywhere">
        <div className="flex items-center gap-2">
          <TokenLogo size="sm" tokenSymbol="ETH" />
          <span className="font-mono">ETH</span>
        </div>
      </td>
      <td className="break-words wrap-anywhere font-mono">{formattedRequired} ETH</td>
      <td className="break-words wrap-anywhere">
        {(canShowRevokeButton || canShowWithdrawButton) ? (
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">{displayedApprovedAmount} ETH</span>
            {canShowRevokeButton && (
              <RevokeApprovalButton isRevoking={isRevoking} onRevoke={onRevokeApproval} />
            )}
            {canShowWithdrawButton && (
              <WithdrawEtherButton isWithdrawing={isWithdrawing} onWithdraw={onWithdrawETH} />
            )}
          </div>
        ) : (
          <span className="break-numbers">{displayedApprovedAmount} ETH</span>
        )}
      </td>
      <td className="wrap-anywhere">
        <div className="flex items-center gap-2">
          <ApprovalStatusIcon isApproved={hasEnoughEther} isExpired={isExpired} isSettled={isSettled} />
          {hasEnoughEther && approvalTransactionUrl && (
            <Tooltip content="View this approval transaction on blockchain explorer">
              <a
              aria-label="View approval transaction on blockchain explorer"
              className="transition-colours text-primary hover:text-primary-interact"
              href={approvalTransactionUrl}
              rel="noopener noreferrer"
              target="_blank">
                <ExternalLink className="size-4" />
              </a>
            </Tooltip>
          )}
        </div>
      </td>
    </tr>
  );
}

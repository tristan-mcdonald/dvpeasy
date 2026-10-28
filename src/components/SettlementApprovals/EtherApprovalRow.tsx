import ApprovalStatusIcon from './ApprovalStatusIcon';
import RevokeApprovalButton from './RevokeApprovalButton';
import WithdrawEtherButton from './WithdrawEtherButton';
import { formatEther } from 'viem';
import { PartyStatusForDisplay } from '../../types/settlement';
import { TokenLogo } from '../TokenLogo';

interface EtherApprovalRowProps {
  partyStatus: PartyStatusForDisplay;
  isExpired: boolean;
  isSettled: boolean;
  isUserParty: boolean;
  onRevokeApproval?: () => void;
  onWithdrawETH?: () => void;
  isRevoking?: boolean;
  isWithdrawing?: boolean;
}

export default function EtherApprovalRow ({
  partyStatus,
  isExpired,
  isSettled,
  isUserParty,
  onRevokeApproval,
  onWithdrawETH,
  isRevoking = false,
  isWithdrawing = false,
}: EtherApprovalRowProps) {
  if (partyStatus.etherRequired === 0n) return null;

  const hasEnoughEther = partyStatus.etherDeposited >= partyStatus.etherRequired;
  const formattedRequired = formatEther(partyStatus.etherRequired);
  const formattedDeposited = formatEther(partyStatus.etherDeposited);

  // When settlement is settled, show the required amount as the approved amount since funds were transferred.
  const displayedApprovedAmount = isSettled ? formattedRequired : formattedDeposited;

  const canShowRevokeButton = isUserParty && partyStatus.isApproved && !isExpired && !isSettled && onRevokeApproval;
  const canShowWithdrawButton = isUserParty && partyStatus.isApproved && isExpired && !isSettled && partyStatus.etherDeposited > 0n && onWithdrawETH;

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
        </div>
      </td>
    </tr>
  );
}

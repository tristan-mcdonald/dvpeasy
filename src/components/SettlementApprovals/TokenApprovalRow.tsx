import ApprovalStatusIcon from './ApprovalStatusIcon';
import NFTCollectionPreview from '../NFTCollectionPreview';
import TokenApprovalButtons from './TokenApprovalButtons';
import { Infinity } from 'lucide-react';
import { settlements } from '../../lib/settlements';
import { TokenLogo } from '../TokenLogo';
import { TokenStatusForDisplay } from '../../types/settlement';

interface TokenApprovalRowProps {
  tokenStatus: TokenStatusForDisplay;
  isUserParty: boolean;
  approvingToken: string | null;
  isExpired: boolean;
  isSettled: boolean;
  onApproveToken: (tokenAddress: string, amount: bigint) => void;
  onMaxApprove: (tokenAddress: string) => void;
}

/**
 * A row of a party's approval card for one token: how much is required and approved, and the
 * buttons to approve it.
 */
export default function TokenApprovalRow ({
  tokenStatus,
  isUserParty,
  approvingToken,
  isExpired,
  isSettled,
  onApproveToken,
  onMaxApprove,
}: TokenApprovalRowProps) {
  const hasApproval = settlements.isTokenApproved(tokenStatus);
  const isTokenApproving = approvingToken?.toLowerCase() === tokenStatus.tokenAddress.toLowerCase() && isUserParty;

  const renderApprovalColumn = () => {
    if (!hasApproval && !isExpired && !isSettled && isUserParty) {
      return (
        <TokenApprovalButtons
        isApproving={isTokenApproving}
        onApproveToken={onApproveToken}
        onMaxApprove={onMaxApprove}
        tokenStatus={tokenStatus} />
      );
    }

    if (tokenStatus.isMaxApproval) {
      return (
        <div className="flex items-center gap-1">
          <Infinity className="size-4" />
          <span>Unlimited approval granted</span>
        </div>
      );
    }

    // Once settled, the tokens have moved, so the amount required is shown as approved.
    const displayedApprovedAmount = isSettled ? tokenStatus.formattedRequired : tokenStatus.formattedApproved;

    return (
      <span className="font-mono break-numbers">{displayedApprovedAmount}</span>
    );
  };

  return (
    <tr>
      <td className="break-words wrap-anywhere">
        <div className="flex items-center gap-2">
          {tokenStatus.isNFT ? (
            <div className="size-5 rounded overflow-hidden">
              <NFTCollectionPreview
              className="size-5"
              size="thumbnail"
              tokenAddress={tokenStatus.tokenAddress}
              tokenId="1" />
            </div>
          ) : (
            <TokenLogo
            size="sm"
            tokenSymbol={tokenStatus.symbol} />
          )}
          <span>{tokenStatus.symbol}</span>
        </div>
      </td>
      <td className="break-words wrap-anywhere font-mono">{tokenStatus.formattedRequired}</td>
      <td className="break-words wrap-anywhere">{renderApprovalColumn()}</td>
      <td className="wrap-anywhere">
        <div className="flex items-center gap-2">
          <ApprovalStatusIcon
          isApproved={hasApproval}
          isExpired={isExpired}
          isSettled={isSettled} />
        </div>
      </td>
    </tr>
  );
}

import Tooltip from '../Tooltip';
import { Check, Infinity, Loader2 } from 'lucide-react';
import { FormattedTokenStatus } from './types';
import { settlementManager } from './utils';

interface TokenApprovalButtonsProps {
  tokenStatus: FormattedTokenStatus;
  onApproveToken: (tokenAddress: string, amount: bigint) => void;
  onMaxApprove: (tokenAddress: string) => void;
  isApproving: boolean;
}

export default function TokenApprovalButtons ({
  tokenStatus,
  onApproveToken,
  onMaxApprove,
  isApproving,
}: TokenApprovalButtonsProps) {
  const requiredAmount = tokenStatus.amountOrIdRequired - tokenStatus.amountOrIdApprovedForDvp;
  const shouldShowAmount = tokenStatus.amountOrIdApprovedForDvp > 0n;

  if (isApproving) {
    return (
      <div className="flex flex-col gap-2">
        {shouldShowAmount && (
          <span className="font-mono break-numbers">{tokenStatus.formattedApproved}</span>
        )}
        <div className="flex items-center gap-1">
          <Loader2 className="size-4 animate-spin" />
          <span>Approving…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {shouldShowAmount && (
        <span className="font-mono break-numbers">{tokenStatus.formattedApproved}</span>
      )}
      <div className="flex gap-1">
        <Tooltip content="Approve the exact amount needed for this settlement">
          <button
          className="btn btn-sm btn-outline btn-primary"
          onClick={() => onApproveToken(tokenStatus.tokenAddress, requiredAmount)}>
            <Check className="size-3" />
            <span className="text-sm font-mono">
              {settlementManager.formattedApprovalAmount(
                tokenStatus.formattedRequired,
                tokenStatus.amountOrIdRequired,
                tokenStatus.amountOrIdApprovedForDvp,
                tokenStatus.symbol,
              )}
            </span>
          </button>
        </Tooltip>
        <Tooltip content="Give unlimited approval (no need to approve again for future transactions)">
          <button
          className="btn btn-sm btn-gradient btn-primary"
          onClick={() => onMaxApprove(tokenStatus.tokenAddress)}>
            <Check className="size-3" />
            <Infinity className="size-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

import Tooltip from '../Tooltip';
import { Check, Infinity, Loader2 } from 'lucide-react';
import { FormattedTokenStatus } from './types';
import { settlementManager } from './utils';
import { useWalletNetwork } from '../../hooks/useWalletNetwork';

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
  const { isWalletOnUrlNetwork } = useWalletNetwork();
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
        <Tooltip content={tokenStatus.isNFT ? 'Approve this NFT for this settlement' : 'Approve the exact amount needed for this settlement'}>
          <button
          className="btn btn-sm btn-outline btn-primary"
          disabled={!isWalletOnUrlNetwork}
          onClick={() => onApproveToken(tokenStatus.tokenAddress, requiredAmount)}>
            <Check className="size-3" />
            <span className="text-sm font-mono">
              {tokenStatus.isNFT ? tokenStatus.formattedRequired : settlementManager.formattedApprovalAmount(
                tokenStatus.formattedRequired,
                tokenStatus.amountOrIdRequired,
                tokenStatus.amountOrIdApprovedForDvp,
                tokenStatus.symbol,
              )}
            </span>
          </button>
        </Tooltip>
        {/* An ERC-721 approval is for one token ID, so there's no unlimited amount to approve. */}
        {!tokenStatus.isNFT && (
          <Tooltip content="Give unlimited approval (no need to approve again for future transactions)">
            <button
            className="btn btn-sm btn-gradient btn-primary"
            disabled={!isWalletOnUrlNetwork}
            onClick={() => onMaxApprove(tokenStatus.tokenAddress)}>
              <Check className="size-3" />
              <Infinity className="size-4" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

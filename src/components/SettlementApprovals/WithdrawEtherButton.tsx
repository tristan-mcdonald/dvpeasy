import { ArrowDownRight, Loader2 } from 'lucide-react';
import { useWalletNetwork } from '../../hooks/useWalletNetwork';

interface WithdrawEtherButtonProps {
  isWithdrawing: boolean
  onWithdraw: () => void
}

/**
 * Withdraws the ETH the connected party deposited in a settlement which expired.
 */
export default function WithdrawEtherButton ({ isWithdrawing, onWithdraw }: WithdrawEtherButtonProps) {
  const { isWalletOnUrlNetwork } = useWalletNetwork();

  return (
    <button
    className="btn btn-sm btn-outline btn-primary"
    disabled={isWithdrawing || !isWalletOnUrlNetwork}
    onClick={onWithdraw}
    type="button">
      {isWithdrawing ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span className="font-sans text-sm">Withdrawing…</span>
        </>
      ) : (
        <>
          <ArrowDownRight className="size-4" />
          <span className="font-sans text-sm">Withdraw ETH</span>
        </>
      )}
    </button>
  );
}

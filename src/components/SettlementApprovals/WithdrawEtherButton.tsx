import { ArrowDownRight, Loader2 } from 'lucide-react';

interface WithdrawEtherButtonProps {
  isWithdrawing: boolean
  onWithdraw: () => void
}

export default function WithdrawEtherButton ({ isWithdrawing, onWithdraw }: WithdrawEtherButtonProps) {
  return (
    <button
    className="btn btn-sm btn-outline btn-primary"
    disabled={isWithdrawing}
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

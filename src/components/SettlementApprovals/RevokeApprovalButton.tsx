import { Loader2, X } from 'lucide-react';
import { useWalletNetwork } from '../../hooks/useWalletNetwork';

interface RevokeApprovalButtonProps {
  isRevoking: boolean
  onRevoke: () => void
}

/**
 * Revokes the connected party's approval of a settlement, returning any ETH it deposited.
 */
export default function RevokeApprovalButton ({ isRevoking, onRevoke }: RevokeApprovalButtonProps) {
  const { isWalletOnUrlNetwork } = useWalletNetwork();

  return (
    <button
    className="btn btn-sm btn-outline btn-error"
    disabled={isRevoking || !isWalletOnUrlNetwork}
    onClick={onRevoke}
    type="button">
      {isRevoking ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span className="font-sans text-sm">Revoking…</span>
        </>
      ) : (
        <>
          <X className="size-4" />
          <span className="font-sans text-sm">Revoke approval</span>
        </>
      )}
    </button>
  );
}

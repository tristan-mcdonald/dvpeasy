import { Loader2, X } from 'lucide-react';

interface RevokeApprovalButtonProps {
  isRevoking: boolean
  onRevoke: () => void
}

export default function RevokeApprovalButton ({ isRevoking, onRevoke }: RevokeApprovalButtonProps) {
  return (
    <button
    className="btn btn-sm btn-outline btn-error"
    disabled={isRevoking}
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

import { Check, Loader2 } from 'lucide-react';
import ButtonLink from './ButtonLink';

interface PartyStatus {
  isApproved: boolean;
}

interface SettlementActionsProps {
  isSettled: boolean;
  isExpired: boolean;
  isConnected: boolean;
  isParticipant: boolean;
  partyStatus: PartyStatus | null;
  allPartiesApproved: boolean;
  isApproving: boolean;
  isExecuting: boolean;
  onApprove: () => void;
  onExecute: () => void;
}

export default function SettlementActions ({
  isSettled,
  isExpired,
  isConnected,
  isParticipant,
  partyStatus,
  allPartiesApproved,
  isApproving,
  isExecuting,
  onApprove,
  onExecute,
}: SettlementActionsProps) {
  if (isSettled || isExpired || !isConnected || !isParticipant || !partyStatus) {
    return null;
  }

  return (
    <div className="flex flex-column gap-4 pb-12">
      {!partyStatus.isApproved && (
        <ButtonLink
        as="button"
        disabled={isApproving}
        fullWidth
        icon={isApproving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        onClick={onApprove}
        size="lg">
          {isApproving ? 'Approving…' : 'Approve settlement'}
        </ButtonLink>
      )}

      {allPartiesApproved && (
        <ButtonLink
        as="button"
        disabled={isExecuting}
        fullWidth
        icon={isExecuting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        onClick={onExecute}
        size="lg"
        variant="primary">
          {isExecuting ? 'Executing…' : 'Execute settlement'}
        </ButtonLink>
      )}
    </div>
  );
}

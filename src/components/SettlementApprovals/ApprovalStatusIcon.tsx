import { Check, Hourglass, X } from 'lucide-react';
import Tooltip from '../Tooltip';

interface ApprovalStatusIconProps {
  isApproved: boolean;
  isExpired: boolean;
  isSettled?: boolean;
  approvedTooltip?: string;
  notApprovedTooltip?: string;
  pendingTooltip?: string;
}

export default function ApprovalStatusIcon ({
  isApproved,
  isExpired,
  isSettled = false,
  approvedTooltip = 'Approval has been made by party',
  notApprovedTooltip = 'Approval was not made by party',
  pendingTooltip = 'Approval has not yet been made by party',
}: ApprovalStatusIconProps) {
  // For settled settlements, always show success.
  if (isSettled) {
    return (
      <Tooltip content={approvedTooltip}>
        <Check className="size-4 text-success" />
      </Tooltip>
    );
  }

  if (isApproved) {
    return (
      <Tooltip content={approvedTooltip}>
        <Check className="size-4 text-success" />
      </Tooltip>
    );
  } else if (isExpired) {
    return (
      <Tooltip content={notApprovedTooltip}>
        <X className="size-4 text-error" />
      </Tooltip>
    );
  } else {
    return (
      <Tooltip content={pendingTooltip}>
        <Hourglass className="size-4 text-warning" />
      </Tooltip>
    );
  }
}

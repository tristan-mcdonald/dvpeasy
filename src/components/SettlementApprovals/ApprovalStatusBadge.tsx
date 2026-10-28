import { ApprovalStatus, ApprovalStatusType } from './utils';
import { Check, Hourglass, X } from 'lucide-react';
import { ReactNode } from 'react';

const BADGE_BY_TYPE: Record<ApprovalStatusType, { className: string; icon: ReactNode }> = {
  error: { className: 'badge-error', icon: <X className="size-4 text-error" /> },
  success: { className: 'badge-success', icon: <Check className="size-4 text-success" /> },
  warning: { className: 'badge-warning', icon: <Hourglass className="size-4 text-warning" /> },
};

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
}

export default function ApprovalStatusBadge ({ status }: ApprovalStatusBadgeProps) {
  const badge = BADGE_BY_TYPE[status.type];

  return (
    <div className={`badge badge-soft ${badge.className}`}>
      {badge.icon}
      <span className="block text-sm">{status.message}</span>
    </div>
  );
}

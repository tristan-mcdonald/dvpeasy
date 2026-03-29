import { ApprovalStatus } from './types';
import { Check, Hourglass, X } from 'lucide-react';

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
}

export default function ApprovalStatusBadge ({ status }: ApprovalStatusBadgeProps) {
  const getIcon = () => {
    switch (status.type) {
      case 'success':
        return <Check className="size-4 text-success" />;
      case 'error':
        return <X className="size-4 text-error" />;
      case 'warning':
        return <Hourglass className="size-4 text-warning" />;
      default:
        return null;
    }
  };

  return (
    <div className={`badge badge-soft ${status.badgeClass}`}>
      {getIcon()}
      <span className="block text-sm">{status.message}</span>
    </div>
  );
}

import { Check, Hourglass, X } from 'lucide-react';
import { ReactNode } from 'react';
import { Settlement, SettlementStatus } from '../types/settlement';
import { settlements } from '../lib/settlements';

const STATUS_DISPLAY: Record<SettlementStatus, ReactNode> = {
  expired: (
    <span className="flex items-center gap-1 text-error">
      <X className="size-5" />
      <span>Expired</span>
    </span>
  ),
  pending: (
    <span className="flex items-center gap-1 text-attention">
      <Hourglass className="size-5" />
      <span>Pending</span>
    </span>
  ),
  settled: (
    <span className="flex items-center gap-1 text-success">
      <Check className="size-5" />
      <span>Settled</span>
    </span>
  ),
};

interface SettlementOverviewProps {
  settlement: Settlement;
}

export default function SettlementOverview ({ settlement }: SettlementOverviewProps) {
  const cutoffDate = new Date(settlement.cutoffDate);

  return (
    <div className="space-y-3">
      <h2>Settlement details</h2>
      <div className="sm:grid sm:grid-cols-3 gap-4 w-full shadow-standard rounded-lg bg-input-background border border-input-border">
        <div className="space-y-1 p-4">
          <span className="block label">Status</span>
          {STATUS_DISPLAY[settlements.status(settlement)]}
        </div>
        <div className="space-y-1 p-4">
          <span className="block label">Cutoff date</span>
          <span className="block">{cutoffDate.toLocaleString()}</span>
        </div>
        <div className="space-y-1 p-4">
          <span className="block label">Auto-settle</span>
          <span
          className={[
            'block font-sans',
            !settlement.isAutoSettled && 'text-text-disabled',
          ].filter(Boolean).join(' ')}>{settlement.isAutoSettled ? 'Enabled' : 'Not enabled'}</span>
        </div>
      </div>
    </div>
  );
}

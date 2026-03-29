import { Check, Hourglass, X } from 'lucide-react';

interface Flow {
  token: string;
  from: string;
  to: string;
  amountOrId: bigint;
  isNFT: boolean;
}

interface Settlement {
  settlementReference: string;
  cutoffDate: bigint;
  flows: Flow[];
  isSettled: boolean;
  isAutoSettled: boolean;
}

interface SettlementOverviewProps {
  settlement: Settlement;
}

export default function SettlementOverview ({ settlement }: SettlementOverviewProps) {
  const cutoffDate = new Date(Number(settlement.cutoffDate) * 1000);
  const isExpired = Number(settlement.cutoffDate) * 1000 < Date.now();

  return (
    <div className="space-y-3">
      <h2>Settlement details</h2>
      <div className="sm:grid sm:grid-cols-3 gap-4 w-full shadow-standard rounded-lg bg-input-background border border-input-border">
        <div className="space-y-1 p-4">
          <span className="block label">Status</span>
          {settlement.isSettled ? (
            <span className="flex items-center gap-1 text-success">
              <Check className="size-5" />
              <span>Settled</span>
            </span>
          ) : isExpired ? (
            <span className="flex items-center gap-1 text-error">
              <X className="size-5" />
              <span>Expired</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-attention">
              <Hourglass className="size-5" />
              <span>Pending</span>
            </span>
          )}
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

import TokensDisplay from './TokensDisplay';
import { urlManager } from '../lib/url-manager';
import { Check, Hourglass, X } from 'lucide-react';
import { memo, ReactNode } from 'react';
import { Settlement, SettlementStatus } from '../types/settlement';
import { settlements } from '../lib/settlements';
import { useCurrentNetwork } from '../hooks/useCurrentNetwork';
import { useNavigate } from 'react-router-dom';

const STATUS_DISPLAY: Record<SettlementStatus, { classColor: string; icon: ReactNode; text: string }> = {
  expired: { classColor: 'text-error', icon: <X className="size-4 text-error/50" />, text: 'Expired' },
  pending: { classColor: 'text-warning', icon: <Hourglass className="size-4 text-warning/50" />, text: 'Pending' },
  settled: { classColor: 'text-success', icon: <Check className="size-4 text-success/50" />, text: 'Settled' },
};

interface SettlementRowProps {
  settlement: Settlement;
}

/**
 * A settlement in the dashboard's table, which opens it when clicked.
 */
const SettlementRow = memo(function SettlementRow ({ settlement }: SettlementRowProps) {
  const navigate = useNavigate();
  const { deployment, network } = useCurrentNetwork();

  const status = STATUS_DISPLAY[settlements.status(settlement)];

  const handleRowClick = () => {
    navigate(urlManager.buildSettlementUrl(network.id, deployment.version.tag, settlement.id));
  };

  return (
    <tr
    className="transition-colors cursor-pointer group"
    onClick={handleRowClick}>
      <td className="font-mono w-[5%] rounded-l-lg group-hover:bg-white group-hover:shadow-standard transition-all">
        <span className="font-mono" data-testid={`settlement-id-${settlement.id}`}>#{settlement.id}</span>
      </td>
      <td className="w-[35%] group-hover:bg-white group-hover:shadow-standard transition-all">{settlement.reference || 'No reference'}</td>
      <td className="w-[20%] group-hover:bg-white group-hover:shadow-standard transition-all">
        <TokensDisplay flows={settlement.flows} />
      </td>
      <td className="w-[20%] group-hover:bg-white group-hover:shadow-standard transition-all">
        <div className={`inline-flex items-center gap-1 ${status.classColor}`}>
          <span className="flex-none">{status.icon}</span>
          <span className="flex-auto">{status.text}</span>
        </div>
      </td>
      <td className="w-[20%] rounded-r-lg group-hover:bg-white group-hover:shadow-standard transition-all">{new Date(settlement.cutoffDate).toLocaleString()}</td>
    </tr>
  );
});

export default SettlementRow;

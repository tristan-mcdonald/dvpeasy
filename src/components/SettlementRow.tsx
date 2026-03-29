import TokensDisplay from './TokensDisplay';
import { urlManager } from '../lib/url-manager';
import { Check, Hourglass, X } from 'lucide-react';
import { contractConfigManager } from '../config/contracts';
import { memo } from 'react';
import { SettlementRowProps } from '../types/components';
import { useNavigate } from 'react-router-dom';

const SettlementRow = memo(function SettlementRow ({ settlement }: SettlementRowProps) {
  const navigate = useNavigate();

  const getSettlementStatus = () => {
    if (settlement.isSettled) {
      return { classColor: 'text-success', icon: <Check className="size-4 text-success/50" />, text: 'Settled' };
    }

    const isExpired = new Date().getTime() > settlement.cutoffDate;

    return isExpired
      ? { classColor: 'text-error', icon: <X className="size-4 text-error/50" />, text: 'Expired' }
      : { classColor: 'text-warning', icon: <Hourglass className="size-4 text-warning/50" />, text: 'Pending' };
  };

  const status = getSettlementStatus();

  const handleRowClick = () => {
    const currentConfig = contractConfigManager.getCurrentConfig();
    const currentVersion = contractConfigManager.getCurrentVersion();
    navigate(urlManager.buildSettlementUrl(currentConfig.networkId, currentVersion, settlement.id));
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
        {'flows' in settlement ? (
          <TokensDisplay flows={settlement.flows} />
        ) : (
          <span className="text-text-placeholder">No data</span>
        )}
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

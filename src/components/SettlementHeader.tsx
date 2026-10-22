import { ArrowLeft, RefreshCw } from 'lucide-react';
import { urlManager } from '../lib/url-manager';
import { useCurrentNetwork } from '../hooks/useCurrentNetwork';
import { useNavigate } from 'react-router-dom';
import HeaderLocal from './HeaderLocal';

interface SettlementHeaderProps {
  settlementId: string | undefined;
  settlementReference: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function SettlementHeader ({
  settlementId,
  settlementReference,
  isRefreshing,
  onRefresh,
}: SettlementHeaderProps) {
  const navigate = useNavigate();
  const { deployment, network } = useCurrentNetwork();

  const handleReturnToDashboard = () => {
    navigate(urlManager.buildDashboardUrl(network.id, deployment.version.tag));
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <button
          className="transition-colors flex items-center gap-2 justify-self-start"
          onClick={handleReturnToDashboard}>
          <ArrowLeft className="size-4 text-primary-subtle" />
          <span className="link link-animated link-primary">Return to Dashboard</span>
        </button>

        <button
          className="transition-colors flex items-center gap-2 justify-self-end"
          disabled={isRefreshing}
          onClick={onRefresh}>
          <RefreshCw className={`size-4 text-primary-subtle ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="link link-animated link-primary">Refresh</span>
        </button>
      </div>

      <HeaderLocal
      description={settlementReference}
      title={`Settlement #${settlementId}`}/>
    </>
  );
}

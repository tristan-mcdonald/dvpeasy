import ButtonLink from '../../../components/ButtonLink';
import HeaderLocal from '../../../components/HeaderLocal';
import { RefreshCw } from 'lucide-react';

interface DashboardErrorStateProps {
  onRetry: () => void;
}

export default function DashboardErrorState ({ onRetry }: DashboardErrorStateProps) {
  return (
    <div>
      <HeaderLocal title="All settlements" />
      <div className="flex justify-between items-center gap-4 p-4 shadow-standard bg-card-background border border-interface-border rounded-lg">
        <p className="text-error">Failed to load settlements. Please try again.</p>
        <ButtonLink
        as="button"
        icon={<RefreshCw className="size-4" />}
        onClick={onRetry}
        variant="primary">Try again</ButtonLink>
      </div>
    </div>
  );
}

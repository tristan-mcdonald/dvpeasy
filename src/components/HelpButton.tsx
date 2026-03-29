import Tooltip from './Tooltip';
import { Info } from 'lucide-react';
import { useCurrentNetworkPath } from '../hooks/useCurrentNetworkPath';
import { useNavigate } from 'react-router-dom';

/**
 * Help button component that navigates to the help page.
 */
export default function HelpButton () {
  const currentNetworkPath = useCurrentNetworkPath();
  const navigate = useNavigate();

  const handleClick = () => {
    // Build help path from current network path.
    const pathSegments = currentNetworkPath.split('/').filter(Boolean);
    const helpPath = pathSegments.length === 2
      ? `/${pathSegments[0]}/${pathSegments[1]}/help`
      : '/help';

    navigate(helpPath);
  };

  return (
    <Tooltip content="Help &amp; information">
      <button
      aria-label="Help &amp; information"
      className="transition-colors flex items-center justify-center size-12 rounded-l-lg border-t border-b border-l border-interface-border bg-card-background hover:bg-white text-primary hover:text-primary-interaction"
      onClick={handleClick}
      type="button">
        <Info className="size-6" />
      </button>
    </Tooltip>
  );
}

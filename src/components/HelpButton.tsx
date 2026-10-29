import Tooltip from './Tooltip';
import { Info } from 'lucide-react';
import { useCurrentNetworkPath } from '../hooks/useCurrentNetworkPath';
import { useNavigate } from 'react-router-dom';

/**
 * The header's link to the help page on the current network.
 */
export default function HelpButton () {
  const currentNetworkPath = useCurrentNetworkPath();
  const navigate = useNavigate();

  const handleClick = () => {
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

import { savedSelection } from '../lib/saved-selection';
import { urlManager } from '../lib/url-manager';
import { useLocation } from 'react-router-dom';

/**
 * The dashboard's path for the network and version in the URL, or for the user's last choice.
 * It reads the location rather than the route's parameters, for components outside the network's
 * routes, such as the header and the 404 page.
 */
export function useCurrentNetworkPath (): string {
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length >= 2) {
    const potentialNetwork = pathSegments[0];
    const potentialVersion = pathSegments[1];

    const parsed = urlManager.parseNetworkAndVersion({
      network: potentialNetwork,
      version: potentialVersion,
    });

    if (parsed) {
      return urlManager.buildDashboardUrl(parsed.networkId, parsed.version);
    }
  }

  const { networkId, version } = savedSelection.initial();
  return urlManager.buildDashboardUrl(networkId, version);
}

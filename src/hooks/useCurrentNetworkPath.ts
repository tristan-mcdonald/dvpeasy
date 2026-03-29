import { urlManager } from '../lib/url-manager';
import { useLocation } from 'react-router-dom';

/**
 * Hook to extract network and version from the current URL path.
 * Returns the dashboard path for the current or default network/version.
 * Used by components outside the nested route structure (HeaderGlobal, Error404).
 */
export function useCurrentNetworkPath (): string {
  const location = useLocation();

  // Extract network and version from URL path pattern: /{network}/{version}/...
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Check if path has at least network and version segments.
  if (pathSegments.length >= 2) {
    const potentialNetwork = pathSegments[0];
    const potentialVersion = pathSegments[1];

    // Validate the extracted network and version.
    const parsed = urlManager.parseNetworkAndVersion({
      network: potentialNetwork,
      version: potentialVersion,
    });

    if (parsed) {
      return `/${parsed.networkId}/${parsed.version}`;
    }
  }

  // Fallback to default network and version if URL doesn't contain valid network/version.
  const { networkId, version } = urlManager.defaultNetworkAndVersion();
  return `/${networkId}/${version}`;
}

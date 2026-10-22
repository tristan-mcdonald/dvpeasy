import HeaderLocal from './HeaderLocal';
import { Outlet, useParams } from 'react-router-dom';
import { savedSelection } from '../lib/saved-selection';
import { urlManager } from '../lib/url-manager';
import { useEffect } from 'react';
import { useNetworkSync } from '../hooks/useNetworkSync';

/**
 * Wrapper component for network-scoped routes.
 * Validates the network and version in the URL, and keeps the wallet in step with them.
 */
export default function NetworkWrapper () {
  const params = useParams<{ network?: string; version?: string }>();

  // Parse and validate network/version from URL.
  const parsedParams = urlManager.parseNetworkAndVersion(params);
  // Handle network/version synchronization with auto-sync enabled.
  const {
    isNetworkSynced,
    error: networkError,
    isLoading: isNetworkSyncing,
  } = useNetworkSync({ autoSync: true });

  // Remember the version, so that the network starts on it next time.
  const networkId = parsedParams?.networkId;
  const version = parsedParams?.version;
  useEffect(() => {
    if (networkId && version) savedSelection.saveVersion(networkId, version);
  }, [networkId, version]);

  // Show error if URL network/version is invalid.
  if (!parsedParams) {
    return (
      <HeaderLocal
      centerVertically={true}
      description={`Invalid network "${params.network}" or version "${params.version}"`}
      title="Invalid network or version" />
    );
  }

  // Show network error if synchronization fails.
  if (networkError) {
    return (
      <HeaderLocal
      centerVertically={true}
      description={networkError}
      title="Network synchronization error" />
    );
  }

  // Show network sync status while switching.
  if (!isNetworkSynced && isNetworkSyncing) {
    return (
      <HeaderLocal
      centerVertically={true}
      description="Syncing wallet to the selected network..."
      title="Switching network" />
    );
  }

  return <Outlet />;
}

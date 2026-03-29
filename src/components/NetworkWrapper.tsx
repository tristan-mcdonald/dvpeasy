import HeaderLocal from './HeaderLocal';
import { Outlet, useParams } from 'react-router-dom';
import { urlManager } from '../lib/url-manager';
import { useNetworkSync } from '../hooks/useNetworkSync';
import { useContractConfig } from '../hooks/useContractConfig';

export interface NetworkContextValue {
  networkId: string;
  version: string;
}

/**
 * Wrapper component for network-scoped routes.
 * Validates network/version from URL params and provides context to child routes.
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

  // Handle contract configuration loading state.
  const { isLoading: isConfigLoading, isConfigReady } = useContractConfig();

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

  // Show loading state while contract configuration is updating.
  if (isConfigLoading || !isConfigReady) {
    return (
      <HeaderLocal
      centerVertically={true}
      description="Loading network configuration..."
      title="Configuring network" />
    );
  }

  // Provide network context to child routes.
  const context: NetworkContextValue = {
    networkId: parsedParams.networkId,
    version: parsedParams.version,
  };

  return <Outlet context={context} />;
}

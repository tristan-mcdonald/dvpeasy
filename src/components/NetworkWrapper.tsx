import HeaderLocal from './HeaderLocal';
import WalletNetworkBanner from './WalletNetworkBanner';
import { Outlet, useParams } from 'react-router-dom';
import { savedSelection } from '../lib/saved-selection';
import { urlManager } from '../lib/url-manager';
import { useCurrentNetwork } from '../hooks/useCurrentNetwork';
import { useEffect } from 'react';
import { useWalletNetworkSync } from '../hooks/useWalletNetwork';

/**
 * Wrapper component for network-scoped routes.
 * Validates the network and version in the URL, and keeps the wallet in step with them.
 */
export default function NetworkWrapper () {
  const params = useParams<{ network?: string; version?: string }>();

  // Parse and validate network/version from URL.
  const parsedParams = urlManager.parseNetworkAndVersion(params);
  const { network } = useCurrentNetwork();
  const { isSwitching, isWalletOnUrlNetwork, switchWallet, walletNetwork } = useWalletNetworkSync();

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

  return (
    <>
      {(isSwitching || !isWalletOnUrlNetwork) && (
        <WalletNetworkBanner
        isSwitching={isSwitching}
        network={network}
        onSwitch={switchWallet}
        walletNetwork={walletNetwork} />
      )}
      <Outlet />
    </>
  );
}

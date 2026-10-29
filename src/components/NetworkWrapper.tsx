import HeaderLocal from './HeaderLocal';
import WalletNetworkBanner from './WalletNetworkBanner';
import { Outlet, useParams } from 'react-router-dom';
import { savedSelection } from '../lib/saved-selection';
import { urlManager } from '../lib/url-manager';
import { useCurrentNetwork } from '../hooks/useCurrentNetwork';
import { useEffect } from 'react';
import { useWalletNetworkSync } from '../hooks/useWalletNetwork';

/**
 * The layout of every page under `/{network}/{version}`, which shows an error for a network or
 * version with no deployment, and keeps the wallet in step with the URL.
 */
export default function NetworkWrapper () {
  const params = useParams<{ network?: string; version?: string }>();

  const parsedParams = urlManager.parseNetworkAndVersion(params);
  const { network } = useCurrentNetwork();
  const { isSwitching, isWalletOnUrlNetwork, switchWallet, walletNetwork } = useWalletNetworkSync();

  // Remember the version, so that the network starts on it next time.
  const networkId = parsedParams?.networkId;
  const version = parsedParams?.version;
  useEffect(() => {
    if (networkId && version) savedSelection.saveVersion(networkId, version);
  }, [networkId, version]);

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

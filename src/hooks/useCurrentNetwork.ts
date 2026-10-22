import { contracts, NetworkDeployment } from '../config/contracts/deployments';
import { NETWORKS } from '../config/networks';
import { savedSelection } from '../lib/saved-selection';
import { urlManager } from '../lib/url-manager';
import { useMatch } from 'react-router-dom';
import { useMemo } from 'react';

/**
 * The network and contract deployment in the URL, which every read and write uses whatever chain
 * the wallet is on. Where the URL names none, or an invalid one, it's the user's last choice. It
 * reads the location rather than the route's parameters, so the header can use it too.
 */
export function useCurrentNetwork (): NetworkDeployment {
  const match = useMatch('/:network/:version/*');
  const networkSlug = match?.params.network;
  const version = match?.params.version;

  return useMemo(() => {
    const selection = urlManager.parseNetworkAndVersion({ network: networkSlug, version })
      ?? savedSelection.initial();

    return {
      // Both sources give only versions which are deployed on the network.
      deployment: contracts.deployment(selection.networkId, selection.version)!,
      network: NETWORKS[selection.networkId],
    };
  }, [networkSlug, version]);
}

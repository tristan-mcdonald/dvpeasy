import { contracts } from '../config/contracts/deployments';
import { logger } from '../lib/logger';
import { NetworkId } from '../config/networks';
import { urlManager } from '../lib/url-manager';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Moves to another network or contract version by changing the URL. An open settlement stays
 * open, with the same ID on the new network; any other page goes to the dashboard.
 */
export function useNetworkNavigation () {
  const location = useLocation();
  const navigate = useNavigate();
  const { network } = useCurrentNetwork();

  const navigateTo = (networkId: NetworkId, version: string) => {
    const settlementId = urlManager.extractSettlementIdFromPath(location.pathname);

    if (settlementId) {
      // A full reload, so that every hook on the page starts again on the new network.
      window.location.href = urlManager.buildSettlementUrl(networkId, version, settlementId);
      return;
    }

    navigate(urlManager.buildDashboardUrl(networkId, version), { replace: true });
    logger.info('Changed network/version via URL', { networkId, version });
  };

  return {
    changeNetwork: (networkId: NetworkId) => navigateTo(networkId, contracts.defaultVersion(networkId)),
    changeVersion: (version: string) => navigateTo(network.id, version),
  };
}

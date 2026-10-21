import { contracts } from '../config/contracts/deployments';
import { DEFAULT_NETWORK_ID, NetworkId, networks } from '../config/networks';
import { logger } from './logger';

/**
 * AppKit's own record of the network the wallet last used.
 */
const APPKIT_NETWORK_KEY = 'W3M_STORE_NETWORK';

/**
 * The contract version last picked on each network, by network ID.
 */
const VERSIONS_KEY = 'DVP_CONTRACT_VERSION';

export interface NetworkSelection {
  networkId: NetworkId;
  version: string;
}

/**
 * The network AppKit last used, if it's one the app supports.
 */
function savedNetworkId (): NetworkId | undefined {
  try {
    const appKitState = localStorage.getItem(APPKIT_NETWORK_KEY);
    const chainId = appKitState ? JSON.parse(appKitState)?.caipNetwork?.id : undefined;
    if (!chainId) return undefined;

    return networks.byChainId(Number(chainId))?.id;
  } catch (error) {
    logger.warn('Failed to restore network from AppKit state:', error);
    return undefined;
  }
}

/**
 * The network and contract version the user last chose, kept in `localStorage`.
 */
export const savedSelection = {
  /**
   * Where to start when the URL doesn't say: the network AppKit last used, or the default, with
   * the version last picked on it, or that network's default.
   */
  initial (): NetworkSelection {
    const networkId = savedNetworkId() ?? DEFAULT_NETWORK_ID;
    const savedVersion = savedSelection.version(networkId);
    const version = savedVersion && contracts.deployment(networkId, savedVersion)
      ? savedVersion
      : contracts.defaultVersion(networkId);
    return { networkId, version };
  },

  saveVersion (networkId: string, version: string): void {
    try {
      const existing = localStorage.getItem(VERSIONS_KEY);
      const versions = existing ? JSON.parse(existing) : {};
      versions[networkId] = version;
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
    } catch (error) {
      logger.warn('Failed to persist contract version:', error);
    }
  },

  version (networkId: string): string | null {
    try {
      const versions = localStorage.getItem(VERSIONS_KEY);
      return versions ? JSON.parse(versions)?.[networkId] || null : null;
    } catch (error) {
      logger.warn('Failed to get persisted contract version:', error);
      return null;
    }
  },
};

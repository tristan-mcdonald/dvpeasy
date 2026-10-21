import { CHAIN_ID_TO_NETWORK_ID, networks } from '../config/networks';
import { contracts } from '../config/contracts/deployments';

/**
 * URL management system for application routing.
 * Handles network/version URL generation, parsing, and validation.
 */
export const urlManager = {
  /**
   * Convert camelCase network ID to kebab-case URL slug.
   */
  networkIdToSlug (networkId: string): string {
    return networkId.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  },

  /**
   * Convert kebab-case URL slug back to camelCase network ID.
   */
  slugToNetworkId (slug: string): string {
    return slug.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  },

  /**
   * Build a settlement details URL with network and version.
   */
  buildSettlementUrl (networkId: string, version: string, settlementId: string | number): string {
    const urlSlug = this.networkIdToSlug(networkId);
    return `/${urlSlug}/${version}/settlement/${settlementId}`;
  },

  /**
   * Build a create settlement URL with network and version.
   */
  buildCreateUrl (networkId: string, version: string): string {
    const urlSlug = this.networkIdToSlug(networkId);
    return `/${urlSlug}/${version}/create`;
  },

  /**
   * Build a dashboard URL with network and version.
   */
  buildDashboardUrl (networkId: string, version: string): string {
    const urlSlug = this.networkIdToSlug(networkId);
    return `/${urlSlug}/${version}`;
  },

  /**
   * Parse network and version from URL parameters.
   * Returns null if invalid.
   */
  parseNetworkAndVersion (params: { network?: string; version?: string }): {
    networkId: string;
    version: string;
  } | null {
    const { network, version } = params;

    if (!network || !version) {
      return null;
    }

    // Convert kebab-case URL slug back to camelCase network ID.
    const networkId = this.slugToNetworkId(network);

    // Validate that the version is deployed on this network, which also validates the network.
    if (!contracts.deployment(networkId, version)) {
      return null;
    }

    return {
      networkId,
      version,
    };
  },

  /**
   * Get default network and version for redirects.
   * Returns URL-formatted values (kebab-case network, formatted version).
   */
  defaultNetworkAndVersion (): { networkId: string; version: string } {
    // Try to get from localStorage first.
    try {
      const appKitState = localStorage.getItem('W3M_STORE_NETWORK');
      if (appKitState) {
        const parsedState = JSON.parse(appKitState);
        const chainId = parsedState?.caipNetwork?.id;
        if (chainId) {
          const numericChainId = typeof chainId === 'string' ? parseInt(chainId) : chainId;
          const networkId = networks.byChainId(numericChainId)?.id;
          if (networkId) {
            const versionState = localStorage.getItem('DVP_CONTRACT_VERSION');
            let version = contracts.defaultVersion(networkId);
            if (versionState) {
              const parsedVersionState = JSON.parse(versionState);
              const storedVersion = parsedVersionState?.[networkId];
              if (storedVersion && contracts.deployment(networkId, storedVersion)) {
                version = storedVersion;
              }
            }
            // Return URL-formatted values.
            return {
              networkId: this.networkIdToSlug(networkId),
              version,
            };
          }
        }
      }
    } catch {
      // Fall through to default.
    }

    // Default to Sepolia testnet with latest version.
    const defaultNetworkId = 'sepolia';
    const defaultVersion = contracts.defaultVersion(defaultNetworkId);
    return {
      networkId: this.networkIdToSlug(defaultNetworkId),
      version: defaultVersion,
    };
  },

  /**
   * Get network ID from chain ID.
   */
  networkIdFromChainId (chainId: number): string | null {
    return CHAIN_ID_TO_NETWORK_ID[chainId] || null;
  },

  /**
   * Get the chain ID for a network.
   */
  chainIdForNetwork (networkId: string): number | null {
    const network = networks.byId(networkId);
    return network?.chainId || null;
  },

  /**
   * Extract settlement ID from a URL pathname if it's a settlement detail page.
   */
  extractSettlementIdFromPath (pathname: string): string | null {
    // Match pattern: /{network}/{version}/settlement/{id}
    const settlementMatch = pathname.match(/\/[^/]+\/[^/]+\/settlement\/(\d+)/);
    return settlementMatch ? settlementMatch[1] : null;
  },
};

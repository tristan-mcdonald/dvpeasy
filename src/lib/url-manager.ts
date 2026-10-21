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
   * Extract settlement ID from a URL pathname if it's a settlement detail page.
   */
  extractSettlementIdFromPath (pathname: string): string | null {
    // Match pattern: /{network}/{version}/settlement/{id}
    const settlementMatch = pathname.match(/\/[^/]+\/[^/]+\/settlement\/(\d+)/);
    return settlementMatch ? settlementMatch[1] : null;
  },
};

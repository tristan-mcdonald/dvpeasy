import { contracts } from '../config/contracts/deployments';
import { networks } from '../config/networks';
import type { NetworkSelection } from './saved-selection';

/**
 * The app's paths, which start with the network and the contract version:
 * `/{network}/{version}/…`. Network IDs are camel case and their slugs kebab case, so
 * `baseSepolia` is `/base-sepolia/…`.
 */
export const urlManager = {
  networkIdToSlug (networkId: string): string {
    return networkId.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  },

  slugToNetworkId (slug: string): string {
    return slug.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  },

  buildSettlementUrl (networkId: string, version: string, settlementId: string | number): string {
    const urlSlug = this.networkIdToSlug(networkId);
    return `/${urlSlug}/${version}/settlement/${settlementId}`;
  },

  buildCreateUrl (networkId: string, version: string): string {
    const urlSlug = this.networkIdToSlug(networkId);
    return `/${urlSlug}/${version}/create`;
  },

  buildDashboardUrl (networkId: string, version: string): string {
    const urlSlug = this.networkIdToSlug(networkId);
    return `/${urlSlug}/${version}`;
  },

  /**
   * The network and version in a route's parameters, or `null` unless they name a deployment.
   */
  parseNetworkAndVersion (params: { network?: string; version?: string }): NetworkSelection | null {
    const { network: slug, version } = params;

    if (!slug || !version) {
      return null;
    }

    const network = networks.byId(this.slugToNetworkId(slug));

    if (!network || !contracts.deployment(network.id, version)) {
      return null;
    }

    return {
      networkId: network.id,
      version,
    };
  },

  extractSettlementIdFromPath (pathname: string): string | null {
    // Matches `/{network}/{version}/settlement/{id}`.
    const settlementMatch = pathname.match(/\/[^/]+\/[^/]+\/settlement\/(\d+)/);
    return settlementMatch ? settlementMatch[1] : null;
  },
};

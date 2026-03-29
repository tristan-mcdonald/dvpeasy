import { CHAIN_ID_TO_NETWORK_ID, NETWORKS } from '../config/networks';
import { VERSIONED_CONTRACT_CONFIGS } from '../config/contracts';

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

    // Validate network exists.
    if (!NETWORKS[networkId]) {
      return null;
    }

    // Validate version exists for this network.
    const networkVersions = VERSIONED_CONTRACT_CONFIGS[networkId];
    if (!networkVersions || !networkVersions.versions[version]) {
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
          const networkId = CHAIN_ID_TO_NETWORK_ID[numericChainId];
          if (networkId && VERSIONED_CONTRACT_CONFIGS[networkId]) {
            const versionState = localStorage.getItem('DVP_CONTRACT_VERSION');
            let version = VERSIONED_CONTRACT_CONFIGS[networkId].defaultVersion;
            if (versionState) {
              const parsedVersionState = JSON.parse(versionState);
              const storedVersion = parsedVersionState?.[networkId];
              if (storedVersion && VERSIONED_CONTRACT_CONFIGS[networkId].versions[storedVersion]) {
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

    // Default to Polygon Mainnet with latest version.
    const defaultNetworkId = 'polygon';
    const defaultVersion = VERSIONED_CONTRACT_CONFIGS.polygon?.defaultVersion || 'v1.0';
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
   * Check if a network and version combination is valid.
   */
  isValidNetworkVersion (networkId: string, version: string): boolean {
    const networkVersions = VERSIONED_CONTRACT_CONFIGS[networkId];
    return Boolean(networkVersions?.versions[version]);
  },

  /**
   * Get the chain ID for a network.
   */
  chainIdForNetwork (networkId: string): number | null {
    const network = NETWORKS[networkId];
    return network?.chainId || null;
  },

  /**
   * Build URL with query parameters.
   */
  buildUrlWithParams (basePath: string, params: Record<string, string | number | boolean>): string {
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }

    const queryString = queryParams.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  },

  /**
   * Parse current location and extract network/version context.
   */
  parseCurrentLocation (pathname: string): {
    networkId: string | null;
    version: string | null;
    settlementId: string | null;
    page: 'dashboard' | 'create' | 'settlement' | 'unknown';
  } {
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length < 2) {
      return { networkId: null, version: null, settlementId: null, page: 'unknown' };
    }

    const networkSlug = segments[0];
    const version = segments[1];
    const networkId = this.slugToNetworkId(networkSlug);

    // Validate network and version.
    if (!this.isValidNetworkVersion(networkId, version)) {
      return { networkId: null, version: null, settlementId: null, page: 'unknown' };
    }

    // Determine page type.
    let page: 'dashboard' | 'create' | 'settlement' | 'unknown' = 'dashboard';
    let settlementId: string | null = null;

    if (segments.length === 2) {
      page = 'dashboard';
    } else if (segments[2] === 'create') {
      page = 'create';
    } else if (segments[2] === 'settlement' && segments[3]) {
      page = 'settlement';
      settlementId = segments[3];
    } else {
      page = 'unknown';
    }

    return { networkId, version, settlementId, page };
  },

  /**
   * Generate breadcrumb data from current location.
   */
  generateBreadcrumbs (pathname: string): Array<{ label: string; path: string }> {
    const { networkId, version, settlementId, page } = this.parseCurrentLocation(pathname);
    const breadcrumbs: Array<{ label: string; path: string }> = [];

    if (!networkId || !version) {
      return breadcrumbs;
    }

    // Add network/version root.
    const network = NETWORKS[networkId];
    const networkLabel = network ? network.name : networkId;
    breadcrumbs.push({
      label: `${networkLabel} ${version}`,
      path: this.buildDashboardUrl(networkId, version),
    });

    // Add page-specific breadcrumb.
    if (page === 'create') {
      breadcrumbs.push({
        label: 'Create Settlement',
        path: this.buildCreateUrl(networkId, version),
      });
    } else if (page === 'settlement' && settlementId) {
      breadcrumbs.push({
        label: `Settlement #${settlementId}`,
        path: this.buildSettlementUrl(networkId, version, settlementId),
      });
    }

    return breadcrumbs;
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

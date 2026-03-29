import type { AppKitNetwork } from '@reown/appkit/networks';
import {
  arbitrumSepolia as viemArbitrumSepolia,
  avalanche as viemAvalanche,
  avalancheFuji as viemAvalancheFuji,
  base as viemBase,
  baseSepolia as viemBaseSepolia,
  mainnet as viemMainnet,
  polygon as viemPolygon,
  sepolia as viemSepolia,
} from 'viem/chains';
import {
  arbitrumSepolia as appKitArbitrumSepolia,
  avalanche as appKitAvalanche,
  avalancheFuji as appKitAvalancheFuji,
  base as appKitBase,
  baseSepolia as appKitBaseSepolia,
  mainnet as appKitMainnet,
  polygon as appKitPolygon,
  sepolia as appKitSepolia,
} from '@reown/appkit/networks';
import type { Chain } from 'viem';

/**
 * Network metadata interface containing all properties for a blockchain network.
 */
export interface NetworkMetadata {
  id: string;
  displayName: string;
  iconFilename: string | null;
  iconUrl: string | null; // Computed property.
  chainId: number;
  chain: Chain;
  appKitNetwork: AppKitNetwork;
  isTestnet: boolean;
  rpcUrl: string;
}

/**
 * Base path for network icon assets.
 */
const NETWORK_ICONS_PATH = '/icons/networks/';

/**
 * Generate icon URL from filename.
 */
function iconUrl (iconFilename: string | null): string | null {
  return iconFilename ? `${NETWORK_ICONS_PATH}${iconFilename}` : null;
}

/**
 * Get Alchemy API key from environment variables with validation.
 */
function alchemyApiKey (): string {
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ALCHEMY_API_KEY environment variable is required');
  }
  return apiKey;
}

/**
 * Centralized network configurations.
 * Single source of truth for all network-related metadata.
 */
const createNetworkConfig = (
  id: string,
  displayName: string,
  iconFilename: string | null,
  chain: Chain,
  appKitNetwork: AppKitNetwork,
  isTestnet: boolean,
  rpcUrl: string,
): NetworkMetadata => ({
  id,
  displayName,
  iconFilename,
  iconUrl: iconUrl(iconFilename),
  chainId: chain.id,
  chain,
  appKitNetwork,
  isTestnet,
  rpcUrl,
});

export const NETWORKS: Record<string, NetworkMetadata> = {
  arbitrumSepolia: createNetworkConfig(
    'arbitrumSepolia',
    'Arbitrum Sepolia',
    'arbitrum.svg',
    viemArbitrumSepolia,
    appKitArbitrumSepolia,
    true,
    `https://arb-sepolia.g.alchemy.com/v2/${alchemyApiKey()}`,
  ),
  avalanche: createNetworkConfig(
    'avalanche',
    'Avalanche C-Chain',
    'avalanche.svg',
    viemAvalanche,
    appKitAvalanche,
    false,
    'https://api.avax.network/ext/bc/C/rpc',
  ),
  avalancheFuji: createNetworkConfig(
    'avalancheFuji',
    'Avalanche Fuji',
    'avalanche.svg',
    viemAvalancheFuji,
    appKitAvalancheFuji,
    true,
    'https://api.avax-test.network/ext/bc/C/rpc',
  ),
  base: createNetworkConfig(
    'base',
    'Base',
    'base.svg',
    viemBase,
    appKitBase,
    false,
    `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey()}`,
  ),
  baseSepolia: createNetworkConfig(
    'baseSepolia',
    'Base Sepolia',
    'base.svg',
    viemBaseSepolia,
    appKitBaseSepolia,
    true,
    `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey()}`,
  ),
  mainnet: createNetworkConfig(
    'mainnet',
    'Ethereum',
    'ethereum.svg',
    viemMainnet,
    appKitMainnet,
    false,
    `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey()}`,
  ),
  polygon: createNetworkConfig(
    'polygon',
    'Polygon Mainnet',
    'polygon.svg',
    viemPolygon,
    appKitPolygon,
    false,
    `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey()}`,
  ),
  sepolia: createNetworkConfig(
    'sepolia',
    'Ethereum Sepolia',
    'ethereum.svg',
    viemSepolia,
    appKitSepolia,
    true,
    `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey()}`,
  ),
};

/**
 * Centralized network configuration manager for all network-related operations.
 */
export const networkConfigManager = {
  /**
   * Network metadata by chain ID.
   */
  byChainId (chainId: number): NetworkMetadata | undefined {
    return Object.values(NETWORKS).find(network => network.chainId === chainId);
  },

  /**
   * Display name for a network with optional environment indicator.
   */
  displayName (network: NetworkMetadata, showEnvironment: boolean = true): string {
    if (showEnvironment) {
      return `${network.displayName} (${network.isTestnet ? 'DEV' : 'PROD'})`;
    }
    return network.displayName;
  },

  /**
   * Filtered networks based on testnet preference.
   */
  filteredNetworks (showTestNetworks: boolean): NetworkMetadata[] {
    return Object.values(NETWORKS).filter(network => {
      return showTestNetworks || !network.isTestnet;
    });
  },

  /**
   * AppKit network object by chain ID.
   */
  appKitNetworkByChainId (chainId: number): AppKitNetwork | undefined {
    const network = this.byChainId(chainId);
    return network?.appKitNetwork;
  },

  /**
   * Arrays of networks for wagmi/AppKit configuration.
   */
  networkArrays () {
    const networkMetadataArray = Object.values(NETWORKS);
    return {
      appKitNetworks: networkMetadataArray.map(network => network.appKitNetwork),
      viemChains: networkMetadataArray.map(network => network.chain),
    };
  },

  /**
   * Transport configuration for wagmi from network metadata.
   */
  networkTransports () {
    return Object.values(NETWORKS).reduce((transports, network) => ({
      ...transports,
      [network.chainId]: network.rpcUrl,
    }), {});
  },

  /**
   * Network category by network ID.
   */
  networkCategory (networkId: string): NetworkCategory | undefined {
    if (networkId === 'mainnet' || networkId === 'sepolia') return NetworkCategory.ETHEREUM;
    if (networkId.includes('arbitrum')) return NetworkCategory.ARBITRUM;
    if (networkId.includes('avalanche')) return NetworkCategory.AVALANCHE;
    if (networkId.includes('polygon')) return NetworkCategory.POLYGON;
    if (networkId.includes('base')) return NetworkCategory.BASE;
    return undefined;
  },

  /**
   * Networks grouped by testnet status.
   */
  networksByType () {
    const allNetworks = Object.values(NETWORKS);
    return {
      mainnet: allNetworks.filter(network => !network.isTestnet),
      testnet: allNetworks.filter(network => network.isTestnet),
    };
  },

  /**
   * Networks grouped by category.
   */
  networksByCategory (): Record<NetworkCategory, NetworkMetadata[]> {
    const result = {
      [NetworkCategory.BASE]: [],
      [NetworkCategory.ETHEREUM]: [],
      [NetworkCategory.ARBITRUM]: [],
      [NetworkCategory.AVALANCHE]: [],
      [NetworkCategory.POLYGON]: [],
    } as Record<NetworkCategory, NetworkMetadata[]>;

    Object.values(NETWORKS).forEach(network => {
      const category = this.networkCategory(network.id);
      if (category) {
        result[category].push(network);
      }
    });

    return result;
  },

  /**
   * Sort networks alphabetically by display name.
   */
  sortAlphabetically (networks: NetworkMetadata[]): NetworkMetadata[] {
    return networks.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },

  /**
   * Network by ID with validation.
   */
  byId (networkId: string): NetworkMetadata | undefined {
    return NETWORKS[networkId];
  },

  /**
   * Check if a chain ID is supported.
   */
  isChainIdSupported (chainId: number): boolean {
    return Object.values(NETWORKS).some(network => network.chainId === chainId);
  },

  /**
   * All supported chain IDs.
   */
  supportedChainIds (): number[] {
    return Object.values(NETWORKS).map(network => network.chainId);
  },

  /**
   * Validate network configuration on startup.
   */
  validateConfigurations (): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate chain IDs.
    const chainIds = Object.values(NETWORKS).map(network => network.chainId);
    const duplicateChainIds = chainIds.filter((chainId, index) => chainIds.indexOf(chainId) !== index);
    if (duplicateChainIds.length > 0) {
      errors.push(`Duplicate chain IDs found: ${duplicateChainIds.join(', ')}`);
    }

    // Check for missing required properties.
    Object.entries(NETWORKS).forEach(([key, network]) => {
      if (!network.id || !network.displayName || !network.chain || !network.appKitNetwork) {
        errors.push(`Network ${key} is missing required properties`);
      }
      if (network.id !== key) {
        errors.push(`Network ${key} has mismatched ID: ${network.id}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};


/**
 * Map chain ID to network ID for configuration lookup.
 */
export const CHAIN_ID_TO_NETWORK_ID: Record<number, string> = Object.values(NETWORKS).reduce(
  (accumulator, network) => ({
    ...accumulator,
    [network.chainId]: network.id,
  }),
  {},
);


/**
 * Network category definitions.
 */
export enum NetworkCategory {
  BASE = 'base',
  ETHEREUM = 'ethereum',
  ARBITRUM = 'arbitrum',
  AVALANCHE = 'avalanche',
  POLYGON = 'polygon',
}

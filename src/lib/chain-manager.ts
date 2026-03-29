import { getAddress } from 'viem';
import { logger } from './logger';

/**
 * Constants for blockchain configuration.
 */
const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

/**
 * NFT marketplace URL pattern configuration.
 */
export interface NftUrlPattern {
  /** Type of URL pattern. */
  type: 'opensea-mainnet' | 'opensea-testnet';
  /** URL pattern with placeholders. */
  pathPattern: string;
  /** Network slug for this chain. */
  networkSlug: string;
}

/**
 * Centralised blockchain network configuration and utilities.
 *
 * This module provides consistent network information across the application, including TrustWallet
 * folder mapping, native token information, and block explorer URLs for supported networks.
 */
export interface ChainConfig {
  /** Human-readable chain name. */
  name: string;
  /** TrustWallet assets folder name for logo URLs. */
  trustWalletFolder: string;
  /** Whether this is a testnet (affects API behavior). */
  isTestnet: boolean;
  /** Block explorer base URL for this chain. */
  blockExplorerUrl: string;
  /** NFT marketplace base URL for this chain. */
  nftMarketplaceUrl: string;
  /** NFT marketplace URL format ('opensea' or 'opensea-testnet'). */
  nftUrlFormat: 'opensea' | 'opensea-testnet';
  /** NFT URL pattern configuration. */
  nftUrlPattern: NftUrlPattern;
  /** Faucet URL for testnet tokens (testnets only). */
  faucetUrl?: string;
  /** Native token information for this chain. */
  nativeToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
}

/**
 * Supported blockchain networks configuration.
 */
export const CHAIN_CONFIG: Record<number, ChainConfig> = {
  1: {
    name: 'Ethereum Mainnet',
    trustWalletFolder: 'ethereum',
    isTestnet: false,
    blockExplorerUrl: 'https://etherscan.io',
    nftMarketplaceUrl: 'https://opensea.io',
    nftUrlFormat: 'opensea',
    nftUrlPattern: {
      type: 'opensea-mainnet',
      pathPattern: '/item/{networkSlug}/{contract}/{token}',
      networkSlug: 'ethereum',
    },
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
  },
  11155111: {
    name: 'Sepolia Testnet',
    trustWalletFolder: 'ethereum',
    isTestnet: true,
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    nftMarketplaceUrl: 'https://testnets.opensea.io',
    nftUrlFormat: 'opensea-testnet',
    nftUrlPattern: {
      type: 'opensea-testnet',
      pathPattern: '/assets/{networkSlug}/{contract}/{token}',
      networkSlug: 'sepolia',
    },
    faucetUrl: 'https://sepoliafaucet.com',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
  },
  137: {
    name: 'Polygon',
    trustWalletFolder: 'polygon',
    isTestnet: false,
    blockExplorerUrl: 'https://polygonscan.com',
    nftMarketplaceUrl: 'https://opensea.io',
    nftUrlFormat: 'opensea',
    nftUrlPattern: {
      type: 'opensea-mainnet',
      pathPattern: '/item/{networkSlug}/{contract}/{token}',
      networkSlug: 'matic',
    },
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
    },
  },
  421614: {
    name: 'Arbitrum Sepolia',
    trustWalletFolder: 'arbitrum',
    isTestnet: true,
    blockExplorerUrl: 'https://sepolia.arbiscan.io',
    nftMarketplaceUrl: 'https://testnets.opensea.io',
    nftUrlFormat: 'opensea-testnet',
    nftUrlPattern: {
      type: 'opensea-testnet',
      pathPattern: '/assets/{networkSlug}/{contract}/{token}',
      networkSlug: 'arbitrum-sepolia',
    },
    faucetUrl: 'https://bridge.arbitrum.io',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
  },
  43113: {
    name: 'Avalanche Fuji',
    trustWalletFolder: 'avalanchec',
    isTestnet: true,
    blockExplorerUrl: 'https://testnet.snowtrace.io',
    nftMarketplaceUrl: 'https://testnets.opensea.io',
    nftUrlFormat: 'opensea-testnet',
    nftUrlPattern: {
      type: 'opensea-testnet',
      pathPattern: '/assets/{networkSlug}/{contract}/{token}',
      networkSlug: 'sepolia',
    },
    faucetUrl: 'https://faucet.avax.network',
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18,
    },
  },
  43114: {
    name: 'Avalanche C-Chain',
    trustWalletFolder: 'avalanchec',
    isTestnet: false,
    blockExplorerUrl: 'https://snowtrace.io',
    nftMarketplaceUrl: 'https://opensea.io',
    nftUrlFormat: 'opensea',
    nftUrlPattern: {
      type: 'opensea-mainnet',
      pathPattern: '/item/{networkSlug}/{contract}/{token}',
      networkSlug: 'avalanche',
    },
    nativeToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18,
    },
  },
} as const;

/**
 * Chain configuration object with bound methods for chain-specific operations.
 * Provides object-oriented access to chain operations.
 */
export class ChainConfigObject {
  constructor (
    private chainId: number,
    private config: ChainConfig,
  ) {}

  /**
   * The basic chain configuration.
   */
  configuration (): ChainConfig {
    return this.config;
  }

  /**
   * The chain ID.
   */
  id (): number {
    return this.chainId;
  }

  /**
   * The chain name.
   */
  name (): string {
    return this.config.name;
  }

  /**
   * Check if this is a testnet.
   */
  isTestnet (): boolean {
    return this.config.isTestnet;
  }

  /**
   * TrustWallet logo URL for a token.
   */
  trustWalletLogoUrl (tokenAddress: string): string | undefined {
    // Special case for native tokens - use different path structure.
    if (tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${this.config.trustWalletFolder}/info/logo.png`;
    }

    try {
      // Apply EIP-55 checksumming using Viem for regular tokens.
      const checksummedAddress = getAddress(tokenAddress);
      return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${this.config.trustWalletFolder}/assets/${checksummedAddress}/logo.png`;
    } catch (error) {
      // If address is invalid, getAddress will throw - return undefined to gracefully handle.
      logger.warn(`Invalid token address for Trust Wallet URL generation: ${tokenAddress}`, error);
      return undefined;
    }
  }

  /**
   * Testnet faucet URL.
   */
  faucetUrl (): string {
    return this.config.faucetUrl || '#';
  }

  /**
   * Block explorer URL for an address.
   */
  addressUrl (address: string): string {
    return `${this.config.blockExplorerUrl}/address/${address}`;
  }

  /**
   * Block explorer URL for a transaction.
   */
  transactionUrl (txHash: string): string {
    return `${this.config.blockExplorerUrl}/tx/${txHash}`;
  }

  /**
   * NFT marketplace URL.
   */
  nftUrl (contractAddress: string, tokenId: string): string {
    // Construct URL.
    const { nftUrlPattern, nftMarketplaceUrl } = this.config;
    const url = nftUrlPattern.pathPattern
      .replace('{networkSlug}', nftUrlPattern.networkSlug)
      .replace('{contract}', contractAddress)
      .replace('{token}', tokenId);

    return `${nftMarketplaceUrl}${url}`;
  }

  /**
   * Validate if a token address format is valid.
   */
  isValidTokenAddress (address: string): boolean {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }

  /**
   * Native token information.
   */
  nativeToken () {
    return this.config.nativeToken;
  }

  /**
   * Block explorer base URL.
   */
  blockExplorerUrl (): string {
    return this.config.blockExplorerUrl;
  }

  /**
   * NFT marketplace base URL.
   */
  nftMarketplaceUrl (): string {
    return this.config.nftMarketplaceUrl;
  }

}

/**
 * Chain management system.
 * Provides centralized access to blockchain configuration and utilities.
 */
export class ChainManager {
  private static instance: ChainManager;
  private chainConfigObjectCache = new Map<number, ChainConfigObject>();

  /**
   * Get singleton instance of ChainManager.
   */
  static getInstance (): ChainManager {
    if (!ChainManager.instance) {
      ChainManager.instance = new ChainManager();
    }
    return ChainManager.instance;
  }

  constructor () {
    // Validate configurations on instantiation.
    this.validateConfigurations();
  }

  /**
   * Human-readable chain name from chain ID.
   */
  chainName (chainId: number): string {
    const config = CHAIN_CONFIG[chainId];
    return config?.name || `Chain ${chainId}`;
  }

  /**
   * Check if a chain ID represents a testnet.
   */
  isTestnetChain (chainId: number): boolean {
    const config = CHAIN_CONFIG[chainId];
    return config?.isTestnet || false;
  }

  /**
   * Chain configuration for a given chain ID.
   */
  chainConfig (chainId: number): ChainConfig | undefined {
    return CHAIN_CONFIG[chainId];
  }

  /**
   * Chain configuration object with bound methods for a given chain ID.
   * Provides object-oriented access to chain-specific operations.
   * Uses memoization to avoid creating duplicate instances.
   */
  chainConfigObject (chainId: number): ChainConfigObject | undefined {
    const config = CHAIN_CONFIG[chainId];
    if (!config) return undefined;

    // Check cache first.
    if (this.chainConfigObjectCache.has(chainId)) {
      return this.chainConfigObjectCache.get(chainId);
    }

    // Create new instance and cache it.
    const configObject = new ChainConfigObject(chainId, config);
    this.chainConfigObjectCache.set(chainId, configObject);
    return configObject;
  }

  /**
   * All supported chain IDs.
   */
  supportedChainIds (): number[] {
    return Object.keys(CHAIN_CONFIG).map(Number);
  }

  /**
   * TrustWallet logo URL for a token on a specific chain.
   * Applies EIP-55 checksumming to ensure proper address formatting.
   */
  trustWalletLogoUrl (chainId: number, tokenAddress: string): string | undefined {
    const configObject = this.chainConfigObject(chainId);
    return configObject?.trustWalletLogoUrl(tokenAddress);
  }

  /**
   * Testnet faucet URL for a given chain ID.
   */
  testnetFaucetUrl (chainId: number): string {
    const configObject = this.chainConfigObject(chainId);
    return configObject?.faucetUrl() || '#';
  }

  /**
   * Block explorer URL for an address on a specific chain.
   */
  blockExplorerAddressUrl (chainId: number, address: string): string | undefined {
    const configObject = this.chainConfigObject(chainId);
    return configObject?.addressUrl(address);
  }

  /**
   * Block explorer URL for a transaction on a specific chain.
   */
  blockExplorerTransactionUrl (chainId: number, txHash: string): string | undefined {
    const configObject = this.chainConfigObject(chainId);
    return configObject?.transactionUrl(txHash);
  }

  /**
   * NFT marketplace URL for an NFT on a specific chain.
   */
  nftMarketplaceUrl (chainId: number, contractAddress: string, tokenId: string): string | undefined {
    const configObject = this.chainConfigObject(chainId);
    return configObject?.nftUrl(contractAddress, tokenId);
  }

  /**
   * Validate if a token address format is valid for EVM chains.
   */
  isValidTokenAddress (address: string): boolean {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }

  /**
   * Chains filtered by testnet status.
   */
  chainsByTestnetStatus (includeTestnets: boolean, includeMainnets: boolean): ChainConfigObject[] {
    return this.supportedChainIds()
      .map(chainId => this.chainConfigObject(chainId))
      .filter((config): config is ChainConfigObject => {
        if (!config) return false;
        const isTestnet = config.isTestnet();
        return (includeTestnets && isTestnet) || (includeMainnets && !isTestnet);
      });
  }


  /**
   * Validate chain configuration integrity on module load.
   * Ensures all configurations have required fields and valid values.
   */
  private validateConfigurations (): void {
    const errors: string[] = [];

    for (const [chainIdStr, config] of Object.entries(CHAIN_CONFIG)) {
      const chainId = Number(chainIdStr);
      const prefix = `Chain ${chainId}`;

      // Validate required fields.
      if (!config.name) errors.push(`${prefix}: missing name`);
      if (!config.trustWalletFolder) errors.push(`${prefix}: missing trustWalletFolder`);
      if (!config.blockExplorerUrl) errors.push(`${prefix}: missing blockExplorerUrl`);
      if (!config.nftMarketplaceUrl) errors.push(`${prefix}: missing nftMarketplaceUrl`);
      if (!config.nftUrlPattern) errors.push(`${prefix}: missing nftUrlPattern`);

      // Validate native token.
      if (!config.nativeToken) {
        errors.push(`${prefix}: missing nativeToken`);
      } else {
        if (!config.nativeToken.symbol) errors.push(`${prefix}: missing nativeToken.symbol`);
        if (!config.nativeToken.name) errors.push(`${prefix}: missing nativeToken.name`);
        if (config.nativeToken.decimals === undefined) errors.push(`${prefix}: missing nativeToken.decimals`);
      }

      // Validate NFT URL pattern.
      if (config.nftUrlPattern) {
        if (!config.nftUrlPattern.pathPattern) errors.push(`${prefix}: missing nftUrlPattern.pathPattern`);
        if (!config.nftUrlPattern.networkSlug) errors.push(`${prefix}: missing nftUrlPattern.networkSlug`);

        // Validate pattern has required placeholders.
        const pattern = config.nftUrlPattern.pathPattern;
        if (!pattern.includes('{contract}')) errors.push(`${prefix}: nftUrlPattern.pathPattern missing {contract} placeholder`);
        if (!pattern.includes('{token}')) errors.push(`${prefix}: nftUrlPattern.pathPattern missing {token} placeholder`);
        if (!pattern.includes('{networkSlug}')) errors.push(`${prefix}: nftUrlPattern.pathPattern missing {networkSlug} placeholder`);
      }

      // Validate testnet consistency.
      if (config.isTestnet && !config.faucetUrl) {
        logger.warn(`${prefix}: testnet should have faucetUrl`);
      }
    }

    if (errors.length > 0) {
      const errorMessage = `Chain configuration validation failed:\n${errors.join('\n')}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    logger.info(`Chain configuration validation passed for ${Object.keys(CHAIN_CONFIG).length} chains`);
  }
}

/**
 * Export singleton instance for convenience.
 */
export const chainManager = ChainManager.getInstance();

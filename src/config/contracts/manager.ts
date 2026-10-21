import type { ContractConfig, ContractConfigWithNetwork, ContractVersion } from './types';
import { CHAIN_ID_TO_NETWORK_ID, NETWORKS, networks } from '../networks';
import { createPublicClient, http, PublicClient } from 'viem';
import { logger } from '../../lib/logger';
import { VERSIONED_CONTRACT_CONFIGS } from './networks';

/**
 * Default configuration key.
 */
const DEFAULT_CONFIG_KEY = 'sepolia';

/**
 * Contract configuration manager.
 * Manages current contract configuration and handles network/version switching.
 */
class ContractConfigManager {
  private currentConfig: ContractConfig;
  private currentVersion: string;
  private publicClient: PublicClient;
  private listeners: ((config: ContractConfigWithNetwork) => void)[] = [];
  private versionListeners: ((networkId: string, version: string) => void)[] = [];
  private networkChangeListeners: ((networkId: string, chainId: number) => void)[] = [];

  constructor () {
    // Start with default config, but try to restore from AppKit's persisted state.
    const { config, version } = this.getInitialConfig();
    this.currentConfig = config;
    this.currentVersion = version;
    this.publicClient = this.createPublicClient();
  }

  private getInitialConfig (): { config: ContractConfig; version: string } {
    let networkId = DEFAULT_CONFIG_KEY;

    // Try to get the persisted network from AppKit's localStorage.
    try {
      const appKitState = localStorage.getItem('W3M_STORE_NETWORK');
      if (appKitState) {
        const parsedState = JSON.parse(appKitState);
        const chainId = parsedState?.caipNetwork?.id;
        if (chainId) {
          const numericChainId = typeof chainId === 'string' ? parseInt(chainId) : chainId;
          const configKey = CHAIN_ID_TO_NETWORK_ID[numericChainId];
          if (configKey && VERSIONED_CONTRACT_CONFIGS[configKey]) {
            networkId = configKey;
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to restore network from AppKit state:', error);
    }

    // Get the default version for the network.
    const networkVersions = VERSIONED_CONTRACT_CONFIGS[networkId];
    if (!networkVersions || !networkVersions.defaultVersion) {
      logger.error(`No contract configuration found for network ${networkId}, falling back to default network`);
      // Fall back to the default network configuration.
      networkId = DEFAULT_CONFIG_KEY;
    }

    // Ensure we have a valid configuration for the network.
    const selectedNetworkVersions = VERSIONED_CONTRACT_CONFIGS[networkId];
    if (!selectedNetworkVersions || !selectedNetworkVersions.defaultVersion) {
      // This should never happen unless configuration is completely broken.
      throw new Error(`Critical: No contract configuration available for network ${networkId}`);
    }

    let version = selectedNetworkVersions.defaultVersion;

    // Try to restore version from localStorage.
    try {
      const versionState = localStorage.getItem('DVP_CONTRACT_VERSION');
      if (versionState) {
        const parsedVersionState = JSON.parse(versionState);
        const networkVersion = parsedVersionState?.[networkId];
        if (networkVersion && this.isValidVersion(networkId, networkVersion)) {
          version = networkVersion;
        }
      }
    } catch (error) {
      logger.warn('Failed to restore contract version from localStorage:', error);
    }

    return {
      config: this.getConfigForNetworkAndVersion(networkId, version),
      version,
    };
  }

  private createPublicClient () {
    const network = NETWORKS[this.currentConfig.networkId];
    return createPublicClient({
      chain: network.chain,
      transport: http(network.rpcUrl),
    });
  }

  /**
   * Get the current configuration with network metadata.
   */
  getCurrentConfig (): ContractConfigWithNetwork {
    const network = NETWORKS[this.currentConfig.networkId];
    return {
      ...this.currentConfig,
      name: networks.displayName(network),
      chainId: network.chainId,
    };
  }

  setConfigByChainId (chainId: number, version?: string): void {
    const configKey = CHAIN_ID_TO_NETWORK_ID[chainId];

    if (!configKey || !VERSIONED_CONTRACT_CONFIGS[configKey]) {
      logger.warn(`No contract configuration found for chain ID ${chainId}, using default`);
      return;
    }

    const networkVersions = VERSIONED_CONTRACT_CONFIGS[configKey];

    // Use provided version, or fall back to persisted/default version.
    const targetVersion = version || this.getPersistedVersion(configKey) || networkVersions?.defaultVersion;

    if (!targetVersion) {
      logger.error(`Unable to determine contract version for network ${configKey}`);
      return;
    }

    // Check if we need to update configuration.
    const needsUpdate = this.currentConfig.networkId !== configKey || this.currentVersion !== targetVersion;

    if (needsUpdate) {
      this.currentConfig = this.getConfigForNetworkAndVersion(configKey, targetVersion);
      this.currentVersion = targetVersion;
      this.publicClient = this.createPublicClient();

      logger.info(`Switched to network ${configKey} version ${targetVersion}`);

      // Notify network change listeners for cache invalidation.
      this.networkChangeListeners.forEach(listener => listener(configKey, chainId));
    }

    // Always notify listeners when setConfigByChainId is called.
    // This ensures UI updates even if the config values haven't changed.
    const configWithNetwork = this.getCurrentConfig();
    this.listeners.forEach(listener => listener(configWithNetwork));
  }

  getSupportedChainIds (): number[] {
    return Object.keys(CHAIN_ID_TO_NETWORK_ID).map(Number);
  }

  getPublicClient () {
    return this.publicClient;
  }

  /**
   * Get all available configurations with network metadata.
   */
  getAvailableConfigs (): Record<string, ContractConfigWithNetwork> {
    const configsWithNetwork: Record<string, ContractConfigWithNetwork> = {};
    for (const [key, networkVersions] of Object.entries(VERSIONED_CONTRACT_CONFIGS)) {
      const defaultConfig = networkVersions.versions[networkVersions.defaultVersion];
      const network = NETWORKS[defaultConfig.networkId];
      if (network) {
        configsWithNetwork[key] = {
          ...defaultConfig,
          name: networks.displayName(network),
          chainId: network.chainId,
            };
      }
    }
    return configsWithNetwork;
  }

  onConfigChange (listener: (config: ContractConfigWithNetwork) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function.
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Version management methods.
   */
  setVersion (networkId: string, version: string): boolean {
    if (!this.isValidVersion(networkId, version)) {
      logger.warn(`Invalid version ${version} for network ${networkId}`);
      return false;
    }

    const newConfig = this.getConfigForNetworkAndVersion(networkId, version);
    const wasCurrentNetwork = this.currentConfig.networkId === networkId;

    if (wasCurrentNetwork) {
      this.currentConfig = newConfig;
      this.currentVersion = version;
      this.publicClient = this.createPublicClient();

      // Notify config listeners if this is the current network.
      const configWithNetwork = this.getCurrentConfig();
      this.listeners.forEach(listener => listener(configWithNetwork));
    }

    // Persist version selection.
    this.persistVersion(networkId, version);

    // Notify version listeners.
    this.versionListeners.forEach(listener => listener(networkId, version));

    return true;
  }

  getCurrentVersion (): string {
    return this.currentVersion;
  }

  getAvailableVersions (networkId: string): ContractVersion[] {
    const networkVersions = VERSIONED_CONTRACT_CONFIGS[networkId];
    if (!networkVersions) {
      return [];
    }

    return Object.values(networkVersions.versions)
      .map(config => config.version)
      .filter((version): version is ContractVersion => Boolean(version))
      .sort((a, b) => b.tag.localeCompare(a.tag)); // Newest first
  }

  onVersionChange (listener: (networkId: string, version: string) => void): () => void {
    this.versionListeners.push(listener);

    // Return unsubscribe function.
    return () => {
      const index = this.versionListeners.indexOf(listener);
      if (index > -1) {
        this.versionListeners.splice(index, 1);
      }
    };
  }

  onNetworkChange (listener: (networkId: string, chainId: number) => void): () => void {
    this.networkChangeListeners.push(listener);

    // Return unsubscribe function.
    return () => {
      const index = this.networkChangeListeners.indexOf(listener);
      if (index > -1) {
        this.networkChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Private helper methods.
   */
  private isValidVersion (networkId: string, version: string): boolean {
    const networkVersions = VERSIONED_CONTRACT_CONFIGS[networkId];
    return Boolean(networkVersions?.versions[version]);
  }

  private getConfigForNetworkAndVersion (networkId: string, version: string): ContractConfig {
    const networkVersions = VERSIONED_CONTRACT_CONFIGS[networkId];
    if (networkVersions?.versions[version]) {
      return networkVersions.versions[version];
    }

    // Fallback to default version for the network, or sepolia as last resort.
    const fallbackNetworkVersions = VERSIONED_CONTRACT_CONFIGS[networkId] || VERSIONED_CONTRACT_CONFIGS[DEFAULT_CONFIG_KEY];
    return fallbackNetworkVersions.versions[fallbackNetworkVersions.defaultVersion];
  }

  private persistVersion (networkId: string, version: string): void {
    try {
      const existing = localStorage.getItem('DVP_CONTRACT_VERSION');
      const versionState = existing ? JSON.parse(existing) : {};
      versionState[networkId] = version;
      localStorage.setItem('DVP_CONTRACT_VERSION', JSON.stringify(versionState));
    } catch (error) {
      logger.warn('Failed to persist contract version:', error);
    }
  }

  getPersistedVersion (networkId: string): string | null {
    try {
      const versionState = localStorage.getItem('DVP_CONTRACT_VERSION');
      if (versionState) {
        const parsedVersionState = JSON.parse(versionState);
        return parsedVersionState?.[networkId] || null;
      }
    } catch (error) {
      logger.warn('Failed to get persisted contract version:', error);
    }
    return null;
  }

  /**
   * Gets contract addresses for all versions on a given network.
   *
   * @param networkId - Network identifier
   * @returns Map of version to contract addresses
   */
  getVersionContractAddresses (networkId: string): Record<string, { dvpAddress: string; dvpHelperAddress: string }> {
    const networkVersions = VERSIONED_CONTRACT_CONFIGS[networkId];
    if (!networkVersions) {
      return {};
    }

    const addresses: Record<string, { dvpAddress: string; dvpHelperAddress: string }> = {};

    for (const [version, config] of Object.entries(networkVersions.versions)) {
      addresses[version] = {
        dvpAddress: config.dvpAddress,
        dvpHelperAddress: config.dvpHelperAddress,
      };
    }

    return addresses;
  }
}

/**
 * Global contract configuration manager instance.
 */
export const contractConfigManager = new ContractConfigManager();

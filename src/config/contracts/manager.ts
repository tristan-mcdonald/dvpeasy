import type { ContractConfig, ContractConfigWithNetwork, ContractVersion, VersionedContractConfigWithNetwork } from './types';
import { CHAIN_ID_TO_NETWORK_ID, networkConfigManager, NETWORKS } from '../networks';
import { chainManager } from '../../lib/chain-manager';
import { contractVersionManager } from './version-manager';
import { createPublicClient, http, PublicClient } from 'viem';
import { logger } from '../../lib/logger';
import { VERSIONED_CONTRACT_CONFIGS } from './networks';

/**
 * Default configuration key.
 */
const DEFAULT_CONFIG_KEY = 'sepolia';

/**
 * Contract configuration object that provides methods tied to a specific configuration.
 */
export class ContractConfigObject {
  constructor (
    private config: ContractConfigWithNetwork,
    private manager: ContractConfigManager,
  ) {}

  /**
   * Get the network identifier.
   */
  get networkId (): string {
    return this.config.networkId;
  }

  /**
   * Get the chain ID.
   */
  get chainId (): number {
    return this.config.chainId;
  }

  /**
   * Get the DVP contract address.
   */
  get dvpAddress (): string {
    return this.config.dvpAddress;
  }

  /**
   * Get the DVP helper contract address.
   */
  get dvpHelperAddress (): string {
    return this.config.dvpHelperAddress;
  }

  /**
   * Get the human-readable network name.
   */
  get name (): string {
    return this.config.name;
  }

  /**
   * Get the network icon URL.
   */
  get iconUrl (): string {
    return this.config.iconUrl;
  }

  /**
   * Get contract addresses for all versions on this network.
   */
  getVersionContractAddresses (): Record<string, { dvpAddress: string; dvpHelperAddress: string }> {
    return this.manager.getVersionContractAddresses(this.networkId);
  }

  /**
   * Get chain configuration object for chain-specific operations.
   */
  getChainConfig () {
    return chainManager.chainConfigObject(this.chainId);
  }

  /**
   * Get the underlying configuration data.
   */
  getRawConfig (): ContractConfigWithNetwork {
    return this.config;
  }
}

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
  private configObjectCache = new Map<string, ContractConfigObject>();

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
      name: networkConfigManager.displayName(network),
      chainId: network.chainId,
      iconUrl: network.iconUrl,
    };
  }

  /**
   * Get raw contract configuration without network metadata.
   */
  getRawConfig (): ContractConfig {
    return this.currentConfig;
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

      // Clear config object cache since configuration changed.
      this.clearConfigObjectCache();

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
          name: networkConfigManager.displayName(network),
          chainId: network.chainId,
          iconUrl: network.iconUrl,
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

      // Clear config object cache since configuration changed.
      this.clearConfigObjectCache();

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

  getVersionedConfig (networkId: string, version: string): VersionedContractConfigWithNetwork | null {
    const config = this.getConfigForNetworkAndVersion(networkId, version);
    if (!config || !config.version) {
      return null;
    }

    const network = NETWORKS[config.networkId];
    if (!network) {
      return null;
    }

    return {
      ...config,
      version: config.version,
      name: networkConfigManager.displayName(network),
      chainId: network.chainId,
      iconUrl: network.iconUrl,
    } as VersionedContractConfigWithNetwork;
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


  /**
   * Version management access methods.
   * Delegates to ContractVersionManager for version-related operations.
   */

  /**
   * Get version manager instance.
   */
  public getVersionManager () {
    return contractVersionManager;
  }

  /**
   * Compare two version strings.
   */
  public compareVersions (v1: string, v2: string): number {
    return contractVersionManager.compareVersions(v1, v2);
  }

  /**
   * Check if a version is compatible with a minimum version.
   */
  public isVersionCompatible (version: ContractVersion, minVersion?: string): boolean {
    return contractVersionManager.isVersionCompatible(version, minVersion);
  }

  /**
   * Sort versions in descending order (newest first).
   */
  public sortVersionsDescending (versions: ContractVersion[]): ContractVersion[] {
    return contractVersionManager.sortVersionsDescending(versions);
  }

  /**
   * Get the latest stable version from available versions for a network.
   */
  public LatestStableVersionForNetwork (networkId: string): ContractVersion | null {
    const versions = this.getAvailableVersions(networkId);
    return contractVersionManager.LatestStableVersion(versions);
  }


  /**
   * Fluent interface for version operations on the current version.
   */
  public forCurrentVersion () {
    return contractVersionManager.forVersion(this.currentConfig.version);
  }

  /**
   * Fluent interface for version operations on available versions for a network.
   */
  public forNetworkVersions (networkId: string) {
    const versions = this.getAvailableVersions(networkId);
    return contractVersionManager.forVersions(versions);
  }

  /**
   * Get the current configuration as an object with methods.
   */
  CurrentConfigObject (): ContractConfigObject {
    const config = this.getCurrentConfig();
    const cacheKey = `${config.networkId}-${this.currentVersion}`;

    // Check cache first.
    if (this.configObjectCache.has(cacheKey)) {
      return this.configObjectCache.get(cacheKey)!;
    }

    // Create new instance and cache it.
    const configObject = new ContractConfigObject(config, this);
    this.configObjectCache.set(cacheKey, configObject);
    return configObject;
  }

  /**
   * Get all available configurations as objects with methods.
   */
  AvailableConfigObjects (): Record<string, ContractConfigObject> {
    const configsWithNetwork = this.getAvailableConfigs();
    const configObjects: Record<string, ContractConfigObject> = {};

    for (const [key, config] of Object.entries(configsWithNetwork)) {
      const cacheKey = `${key}-default`;

      // Check cache first.
      if (this.configObjectCache.has(cacheKey)) {
        configObjects[key] = this.configObjectCache.get(cacheKey)!;
      } else {
        // Create new instance and cache it.
        const configObject = new ContractConfigObject(config, this);
        this.configObjectCache.set(cacheKey, configObject);
        configObjects[key] = configObject;
      }
    }

    return configObjects;
  }

  /**
   * Clear config object cache when configuration changes.
   */
  private clearConfigObjectCache (): void {
    this.configObjectCache.clear();
  }
}

/**
 * Global contract configuration manager instance.
 */
export const contractConfigManager = new ContractConfigManager();

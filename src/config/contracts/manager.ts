import { ContractDeployment, contracts } from './deployments';
import { createPublicClient, http, PublicClient } from 'viem';
import { DVP_ABI, DVP_HELPER_ABI } from './abis';
import { logger } from '../../lib/logger';
import { NetworkId, NETWORKS, networks } from '../networks';
import { savedSelection } from '../../lib/saved-selection';

export interface ContractConfigWithNetwork extends ContractDeployment {
  chainId: number;
  dvpAbi: typeof DVP_ABI;
  dvpHelperAbi: typeof DVP_HELPER_ABI;
  name: string;
  networkId: NetworkId;
}

/**
 * Contract configuration manager.
 * Manages current contract configuration and handles network/version switching.
 */
class ContractConfigManager {
  private currentNetworkId: NetworkId;
  private currentVersion: string;
  private publicClient: PublicClient;
  private listeners: ((config: ContractConfigWithNetwork) => void)[] = [];
  private versionListeners: ((networkId: string, version: string) => void)[] = [];
  private networkChangeListeners: ((networkId: string, chainId: number) => void)[] = [];

  constructor () {
    const { networkId, version } = savedSelection.initial();
    this.currentNetworkId = networkId;
    this.currentVersion = version;
    this.publicClient = this.createPublicClient();
  }

  private createPublicClient () {
    const network = NETWORKS[this.currentNetworkId];
    return createPublicClient({
      chain: network.chain,
      transport: http(network.rpcUrl),
    });
  }

  /**
   * The current deployment, or the network's default one if the current version isn't deployed
   * on it.
   */
  private currentDeployment (): ContractDeployment {
    const networkId = this.currentNetworkId;
    return contracts.deployment(networkId, this.currentVersion)
      ?? contracts.deployment(networkId, contracts.defaultVersion(networkId))!;
  }

  /**
   * Get the current configuration with network metadata.
   */
  getCurrentConfig (): ContractConfigWithNetwork {
    const network = NETWORKS[this.currentNetworkId];
    return {
      ...this.currentDeployment(),
      chainId: network.chainId,
      dvpAbi: DVP_ABI,
      dvpHelperAbi: DVP_HELPER_ABI,
      name: networks.displayName(network),
      networkId: network.id,
    };
  }

  setConfigByChainId (chainId: number, version?: string): void {
    const networkId = networks.byChainId(chainId)?.id;

    if (!networkId) {
      logger.warn(`No contract configuration found for chain ID ${chainId}, using default`);
      return;
    }

    // Use provided version, or fall back to persisted/default version.
    const targetVersion = version || savedSelection.version(networkId) || contracts.defaultVersion(networkId);

    // Check if we need to update configuration.
    const needsUpdate = this.currentNetworkId !== networkId || this.currentVersion !== targetVersion;

    if (needsUpdate) {
      this.currentNetworkId = networkId;
      this.currentVersion = targetVersion;
      this.publicClient = this.createPublicClient();

      logger.info(`Switched to network ${networkId} version ${targetVersion}`);

      // Notify network change listeners for cache invalidation.
      this.networkChangeListeners.forEach(listener => listener(networkId, chainId));
    }

    // Always notify listeners when setConfigByChainId is called.
    // This ensures UI updates even if the config values haven't changed.
    const configWithNetwork = this.getCurrentConfig();
    this.listeners.forEach(listener => listener(configWithNetwork));
  }

  getPublicClient () {
    return this.publicClient;
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
    if (!contracts.deployment(networkId, version)) {
      logger.warn(`Invalid version ${version} for network ${networkId}`);
      return false;
    }

    if (this.currentNetworkId === networkId) {
      this.currentVersion = version;
      this.publicClient = this.createPublicClient();

      // Notify config listeners if this is the current network.
      const configWithNetwork = this.getCurrentConfig();
      this.listeners.forEach(listener => listener(configWithNetwork));
    }

    savedSelection.saveVersion(networkId, version);

    // Notify version listeners.
    this.versionListeners.forEach(listener => listener(networkId, version));

    return true;
  }

  getCurrentVersion (): string {
    return this.currentVersion;
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
}

/**
 * Global contract configuration manager instance.
 */
export const contractConfigManager = new ContractConfigManager();

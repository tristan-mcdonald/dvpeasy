import { ContractConfigWithNetwork } from '../config/contracts';
import { contractConfigManager } from '../config/contracts/manager';
import { chainManager } from './chain-manager';

/**
 * Network management system for application network operations.
 * Handles network filtering, selection, and configuration.
 */
export const networkManager = {
  /**
   * Get available configurations filtered by testnet status.
   */
  availableConfigsFiltered (showTestNetworks: boolean): [string, ContractConfigWithNetwork][] {
    const allConfigs = contractConfigManager.getAvailableConfigs();

    return Object.entries(allConfigs).filter(([, config]) => {
      const isTestnet = chainManager.isTestnetChain(config.chainId);
      // Show mainnets always, testnets only if showTestNetworks is true.
      return !isTestnet || showTestNetworks;
    });
  },

  /**
   * Separate configurations into mainnet and testnet groups.
   */
  separateConfigsByType (configs: [string, ContractConfigWithNetwork][]): {
    mainnetConfigs: [string, ContractConfigWithNetwork][];
    testnetConfigs: [string, ContractConfigWithNetwork][];
  } {
    const mainnetConfigs: [string, ContractConfigWithNetwork][] = [];
    const testnetConfigs: [string, ContractConfigWithNetwork][] = [];

    for (const config of configs) {
      const [, configData] = config;
      const isTestnet = chainManager.isTestnetChain(configData.chainId);

      if (isTestnet) {
        testnetConfigs.push(config);
      } else {
        mainnetConfigs.push(config);
      }
    }

    // Sort by name within each group.
    const sortByName = (a: [string, ContractConfigWithNetwork], b: [string, ContractConfigWithNetwork]) =>
      a[1].name.localeCompare(b[1].name);

    mainnetConfigs.sort(sortByName);
    testnetConfigs.sort(sortByName);

    return { mainnetConfigs, testnetConfigs };
  },

  /**
   * Check if a network is currently selected.
   */
  isNetworkSelected (chainId: number | undefined, configChainId: number): boolean {
    return chainId === configChainId;
  },

  /**
   * Get complete network selection data for UI components.
   */
  networkSelectionData (showTestNetworks: boolean) {
    const filteredConfigs = this.availableConfigsFiltered(showTestNetworks);
    const { mainnetConfigs, testnetConfigs } = this.separateConfigsByType(filteredConfigs);

    return {
      filteredConfigs,
      mainnetConfigs,
      testnetConfigs,
      hasNoNetworks: filteredConfigs.length === 0,
      hasMainnetNetworks: mainnetConfigs.length > 0,
      hasTestnetNetworks: testnetConfigs.length > 0,
    };
  },

  /**
   * Get network information by chain ID.
   */
  networkByChainId (chainId: number): ContractConfigWithNetwork | null {
    const allConfigs = contractConfigManager.getAvailableConfigs();

    for (const config of Object.values(allConfigs)) {
      if (config.chainId === chainId) {
        return config;
      }
    }

    return null;
  },

  /**
   * Get preferred network based on user preferences and availability.
   */
  preferredNetwork (): ContractConfigWithNetwork {
    // Try to get user's last used network.
    const currentConfig = contractConfigManager.getCurrentConfig();
    if (currentConfig) {
      return currentConfig;
    }

    // Fall back to first available mainnet.
    const allConfigs = contractConfigManager.getAvailableConfigs();
    const mainnetConfigs = Object.values(allConfigs).filter(
      config => !chainManager.isTestnetChain(config.chainId),
    );

    if (mainnetConfigs.length > 0) {
      return mainnetConfigs[0];
    }

    // Last resort: return any available config.
    const anyConfig = Object.values(allConfigs)[0];
    if (!anyConfig) {
      throw new Error('No network configurations available');
    }

    return anyConfig;
  },

  /**
   * Check if a network supports a specific feature.
   */
  networkSupportsFeature (chainId: number, feature: 'nft' | 'faucet' | 'explorer'): boolean {
    const chainConfig = chainManager.chainConfig(chainId);
    if (!chainConfig) return false;

    switch (feature) {
      case 'nft':
        return Boolean(chainConfig.nftMarketplaceUrl);
      case 'faucet':
        return Boolean(chainConfig.faucetUrl);
      case 'explorer':
        return Boolean(chainConfig.blockExplorerUrl);
      default:
        return false;
    }
  },

  /**
   * Get network statistics.
   */
  networkStats () {
    const allConfigs = contractConfigManager.getAvailableConfigs();
    const configs = Object.values(allConfigs);

    const mainnetCount = configs.filter(c => !chainManager.isTestnetChain(c.chainId)).length;
    const testnetCount = configs.filter(c => chainManager.isTestnetChain(c.chainId)).length;

    return {
      totalNetworks: configs.length,
      mainnetCount,
      testnetCount,
      supportedChainIds: configs.map(c => c.chainId),
    };
  },

  /**
   * Validate network switch is allowed.
   */
  canSwitchToNetwork (fromChainId: number, toChainId: number): { allowed: boolean; reason?: string } {
    // Check if target network is supported.
    const targetConfig = this.networkByChainId(toChainId);
    if (!targetConfig) {
      return { allowed: false, reason: 'Target network is not supported' };
    }

    // Check if switching between mainnet and testnet.
    const fromIsTestnet = chainManager.isTestnetChain(fromChainId);
    const toIsTestnet = chainManager.isTestnetChain(toChainId);

    if (fromIsTestnet !== toIsTestnet) {
      return {
        allowed: true,
        reason: 'Switching between mainnet and testnet - ensure you understand the implications',
      };
    }

    return { allowed: true };
  },
};

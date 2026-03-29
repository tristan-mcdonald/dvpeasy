import { contractConfigManager, ContractConfigWithNetwork, ContractVersion } from '../config/contracts';
import { PublicClient } from 'viem';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { urlManager } from '../lib/url-manager';

export interface UseContractConfigReturn {
  config: ContractConfigWithNetwork;
  availableConfigs: Record<string, ContractConfigWithNetwork>;
  publicClient: PublicClient;
  isLoading: boolean;
  error: string | null;
  supportedChainIds: number[];
  currentVersion: string;
  availableVersions: ContractVersion[];
  setVersion: (version: string) => boolean;
  isConfigReady: boolean;
  getVersionContractAddresses: () => Record<string, { dvpAddress: string; dvpHelperAddress: string }>;
}

export function useContractConfig (): UseContractConfigReturn {
  const [config, setConfig] = useState<ContractConfigWithNetwork>(contractConfigManager.getCurrentConfig());
  const [currentVersion, setCurrentVersion] = useState<string>(contractConfigManager.getCurrentVersion());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigReady, setIsConfigReady] = useState(false);
  const params = useParams<{ network?: string; version?: string }>();

  // Subscribe to configuration changes from the manager.
  useEffect(() => {
    const unsubscribeConfig = contractConfigManager.onConfigChange((newConfig: ContractConfigWithNetwork) => {
      setConfig(newConfig);
      setCurrentVersion(contractConfigManager.getCurrentVersion());
      setError(null);
      setIsLoading(false);
      setIsConfigReady(true);
    });

    const unsubscribeVersion = contractConfigManager.onVersionChange((networkId: string, version: string) => {
      if (networkId === config.networkId) {
        setCurrentVersion(version);
      }
    });

    return () => {
      unsubscribeConfig();
      unsubscribeVersion();
    };
  }, [config.networkId]);

  // Handle URL-based configuration (URL is the single source of truth).
  useEffect(() => {
    if (params.network && params.version) {
      setIsLoading(true);
      setError(null);
      setIsConfigReady(false);

      // Convert kebab-case URL slug to camelCase network ID.
      const networkId = params.network.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

      const urlChainId = urlManager.chainIdForNetwork(networkId);
      if (urlChainId) {
        try {
          // Set the version first, then the config.
          contractConfigManager.setVersion(networkId, params.version);
          contractConfigManager.setConfigByChainId(urlChainId, params.version);
          // Config ready state will be set by the change listener.
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to set URL-based configuration');
          setIsConfigReady(true); // Still ready, just with an error.
        }
      } else {
        setError(`Invalid network: ${params.network}`);
        setIsConfigReady(true);
      }
      setIsLoading(false);
    } else {
      // No URL params - use default config and mark as ready.
      setIsConfigReady(true);
    }
  }, [params.network, params.version]);

  const handleSetVersion = (version: string): boolean => {
    return contractConfigManager.setVersion(config.networkId, version);
  };

  const getVersionContractAddresses = (): Record<string, { dvpAddress: string; dvpHelperAddress: string }> => {
    return contractConfigManager.getVersionContractAddresses(config.networkId);
  };

  return {
    config,
    availableConfigs: contractConfigManager.getAvailableConfigs(),
    publicClient: contractConfigManager.getPublicClient(),
    isLoading,
    error,
    supportedChainIds: contractConfigManager.getSupportedChainIds(),
    currentVersion,
    availableVersions: contractConfigManager.getAvailableVersions(config.networkId),
    setVersion: handleSetVersion,
    isConfigReady,
    getVersionContractAddresses,
  };
}

// Hook to get current contract addresses.
export function useContractAddresses () {
  const { config } = useContractConfig();

  return {
    dvpAddress: config.dvpAddress,
    dvpHelperAddress: config.dvpHelperAddress,
    dvpAbi: config.dvpAbi,
    dvpHelperAbi: config.dvpHelperAbi,
  };
}

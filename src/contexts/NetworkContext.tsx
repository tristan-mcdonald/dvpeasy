import React, { createContext, useEffect, useState, ReactNode } from 'react';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { contractConfigManager, ContractConfigWithNetwork } from '../config/contracts';
import { networkConfigManager, NetworkMetadata } from '../config/networks';
import { useAppKitNetwork } from '@reown/appkit/react';
import { useChainId } from 'wagmi';

export interface NetworkContextValue {
  chainId: number | undefined;
  network: NetworkMetadata | undefined;
  contractConfig: ContractConfigWithNetwork;
  switchNetwork: ((network: AppKitNetwork) => Promise<void>) | undefined;
  isLoading: boolean;
  error: string | null;
}

export const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * Unified network provider that manages network state across the application.
 * Consolidates AppKit and Wagmi network sources into a single source of truth.
 */
export function NetworkProvider ({ children }: NetworkProviderProps) {
  const { caipNetwork, switchNetwork } = useAppKitNetwork();
  const wagmiChainId = useChainId();
  const [contractConfig, setContractConfig] = useState<ContractConfigWithNetwork>(contractConfigManager.getCurrentConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine the effective chain ID from AppKit (preferred) or Wagmi.
  const effectiveChainId = (() => {
    if (caipNetwork?.id) {
      return typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
    }
    return wagmiChainId;
  })();

  const network = effectiveChainId ? networkConfigManager.byChainId(effectiveChainId) : undefined;

  useEffect(() => {
    // Subscribe to contract configuration changes.
    const unsubscribe = contractConfigManager.onConfigChange((newConfig: ContractConfigWithNetwork) => {
      setContractConfig(newConfig);
      setError(null);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Note: Configuration updates are handled by useContractConfig based on URL params.
  // NetworkContext only provides the current state, not updates.

  const value: NetworkContextValue = {
    chainId: effectiveChainId,
    network,
    contractConfig,
    switchNetwork,
    isLoading,
    error,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

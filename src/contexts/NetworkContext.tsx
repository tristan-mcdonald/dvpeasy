import React, { createContext, useState, ReactNode } from 'react';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { Network, networks } from '../config/networks';
import { useAppKitNetwork } from '@reown/appkit/react';
import { useChainId } from 'wagmi';

export interface NetworkContextValue {
  chainId: number | undefined;
  network: Network | undefined;
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
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  // Determine the effective chain ID from AppKit (preferred) or Wagmi.
  const effectiveChainId = (() => {
    if (caipNetwork?.id) {
      return typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
    }
    return wagmiChainId;
  })();

  const network = effectiveChainId ? networks.byChainId(effectiveChainId) : undefined;

  const value: NetworkContextValue = {
    chainId: effectiveChainId,
    network,
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

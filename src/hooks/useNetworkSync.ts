import { useCurrentNetwork } from './useCurrentNetwork';
import { useChainId, useSwitchChain, useDisconnect } from 'wagmi';
import { networks } from '../config/networks';
import { logger } from '../lib/logger';
import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface UseNetworkSyncOptions {
  // Whether to auto-sync wallet to URL network.
  autoSync?: boolean;
}

export interface UseNetworkSyncReturn {
  // Current wallet network ID.
  walletNetworkId: string | null;
  // Whether URL network matches wallet network.
  isNetworkSynced: boolean;
  // Whether the hook is processing a network change.
  isLoading: boolean;
  // Manually sync wallet to URL network.
  syncWalletToUrl: () => Promise<void>;
}

/**
 * Hook to synchronize URL network/version parameters with wallet network state.
 * Ensures wallet is always connected to the network specified in the URL.
 */
export function useNetworkSync (options: UseNetworkSyncOptions = {}): UseNetworkSyncReturn {
  const { autoSync = false } = options;
  const { network: urlNetwork } = useCurrentNetwork();
  const walletChainId = useChainId();
  const { switchChainAsync, chains } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const [isLoading, setIsLoading] = useState(false);

  // Get wallet network ID from chain ID.
  const walletNetworkId = walletChainId ? networks.byChainId(walletChainId)?.id ?? null : null;
  // Check if networks are synced.
  const isNetworkSynced = urlNetwork.id === walletNetworkId;

  /**
   * Sync wallet to match URL network.
   */
  const syncWalletToUrl = useCallback(async () => {
    if (!switchChainAsync) {
      logger.warn('Cannot sync wallet: missing switch function');
      return;
    }

    const targetChainId = urlNetwork.chainId;

    // Check if target chain is supported.
    const targetChain = chains.find(chain => chain.id === targetChainId);
    if (!targetChain) {
      logger.error(`Chain ${targetChainId} not supported by wallet`);
      toast.error(`Network ${urlNetwork.id} is not supported by your wallet`);
      return;
    }

    setIsLoading(true);
    try {
      logger.info('Syncing wallet to URL network', {
        from: walletNetworkId,
        to: urlNetwork.id,
      });

      await switchChainAsync({ chainId: targetChainId });

      logger.info('Wallet synced successfully');
    } catch (error) {
      // Handle different types of network switch errors.
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          logger.info('User rejected network switch, disconnecting wallet');
          // Disconnect the wallet when user rejects network switch.
          disconnect();
          // Re-throw with specific error for the modal to handle.
          throw new Error('User rejected network switch');
        } else if (error.message.includes('does not support programmatic chain switching')) {
          // MetaMask and some other wallets don't support programmatic switching.
          logger.info('Wallet does not support programmatic chain switching, disconnecting wallet');
          disconnect();
          return;
        } else {
          logger.error('Failed to switch network:', error);
          toast.error('Failed to switch network');
          // Re-throw the original error.
          throw error;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [urlNetwork, walletNetworkId, switchChainAsync, chains, disconnect]);

  // Auto-sync wallet to URL network when enabled and networks don't match.
  useEffect(() => {
    if (autoSync && !isNetworkSynced && walletNetworkId) {
      // Only auto-sync if we have both networks and they don't match.
      syncWalletToUrl();
    }
  }, [autoSync, isNetworkSynced, walletNetworkId, syncWalletToUrl]);

  return {
    walletNetworkId,
    isNetworkSynced,
    isLoading,
    syncWalletToUrl,
  };
}

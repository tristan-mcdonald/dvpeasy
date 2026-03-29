import { useNetworkManager } from './useNetworkManager';
import { useChainId, useSwitchChain, useDisconnect } from 'wagmi';
import { urlManager } from '../lib/url-manager';
import { logger } from '../lib/logger';
import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface UseNetworkSyncOptions {
  // Callback when network/version changes.
  onNetworkVersionChange?: (networkId: string, version: string) => void;
  // Whether to auto-sync wallet to URL network.
  autoSync?: boolean;
}

export interface UseNetworkSyncReturn {
  // Current network ID from URL.
  urlNetworkId: string | null;
  // Current version from URL.
  urlVersion: string | null;
  // Current wallet network ID.
  walletNetworkId: string | null;
  // Whether URL network matches wallet network.
  isNetworkSynced: boolean;
  // Error message if network/version is invalid.
  error: string | null;
  // Whether the hook is processing a network change.
  isLoading: boolean;
  // Manually sync wallet to URL network.
  syncWalletToUrl: () => Promise<void>;
  // Manually sync URL to wallet network.
  syncUrlToWallet: () => void;
}

/**
 * Hook to synchronize URL network/version parameters with wallet network state.
 * Ensures wallet is always connected to the network specified in the URL.
 */
export function useNetworkSync (options: UseNetworkSyncOptions = {}): UseNetworkSyncReturn {
  const { autoSync = false } = options;
  const networkManager = useNetworkManager();
  const walletChainId = useChainId();
  const { switchChainAsync, chains } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const [isLoading, setIsLoading] = useState(false);

  // Get wallet network ID from chain ID.
  const walletNetworkId = walletChainId ? urlManager.networkIdFromChainId(walletChainId) : null;
  // Check if networks are synced.
  const isNetworkSynced = Boolean(
    networkManager.urlNetworkId &&
    walletNetworkId &&
    networkManager.urlNetworkId === walletNetworkId,
  );

  /**
   * Sync wallet to match URL network.
   */
  const syncWalletToUrl = useCallback(async () => {
    if (!networkManager.urlNetworkId || !switchChainAsync) {
      logger.warn('Cannot sync wallet: missing URL network or switch function');
      return;
    }

    const targetChainId = urlManager.chainIdForNetwork(networkManager.urlNetworkId);
    if (!targetChainId) {
      logger.error(`No chain ID found for network ${networkManager.urlNetworkId}`);
      return;
    }

    // Check if target chain is supported.
    const targetChain = chains.find(chain => chain.id === targetChainId);
    if (!targetChain) {
      logger.error(`Chain ${targetChainId} not supported by wallet`);
      toast.error(`Network ${networkManager.urlNetworkId} is not supported by your wallet`);
      return;
    }

    setIsLoading(true);
    try {
      logger.info('Syncing wallet to URL network', {
        from: walletNetworkId,
        to: networkManager.urlNetworkId,
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
  }, [networkManager.urlNetworkId, walletNetworkId, switchChainAsync, chains, disconnect]);

  /**
   * Sync URL to match wallet network.
   */
  const syncUrlToWallet = useCallback(() => {
    if (walletNetworkId) {
      networkManager.changeNetwork(walletNetworkId);
    }
  }, [walletNetworkId, networkManager]);

  // Auto-sync wallet to URL network when enabled and networks don't match.
  useEffect(() => {
    if (autoSync && !isNetworkSynced && networkManager.urlNetworkId && walletNetworkId) {
      // Only auto-sync if we have both networks and they don't match.
      syncWalletToUrl();
    }
  }, [autoSync, isNetworkSynced, networkManager.urlNetworkId, walletNetworkId, syncWalletToUrl]);

  return {
    urlNetworkId: networkManager.urlNetworkId,
    urlVersion: networkManager.urlVersion,
    walletNetworkId,
    isNetworkSynced,
    error: networkManager.error,
    isLoading: isLoading || networkManager.isLoading,
    syncWalletToUrl,
    syncUrlToWallet,
  };
}

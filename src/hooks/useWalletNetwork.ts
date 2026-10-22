import { appKit } from '../config/wagmi';
import { BaseError, UserRejectedRequestError } from 'viem';
import { logger } from '../lib/logger';
import { networks } from '../config/networks';
import toast from 'react-hot-toast';
import { useAccount, useSwitchChain } from 'wagmi';
import { useCallback, useEffect, useRef } from 'react';
import { useCurrentNetwork } from './useCurrentNetwork';

/**
 * Whether the connected wallet is on the URL's network, so that it can send transactions there.
 * A disconnected wallet counts as on it, since there's nothing to switch.
 */
export function useWalletNetwork () {
  const { network } = useCurrentNetwork();
  const { chainId: walletChainId, isConnected } = useAccount();

  return {
    isWalletOnUrlNetwork: !isConnected || walletChainId === network.chainId,
    walletNetwork: walletChainId === undefined ? undefined : networks.byChainId(walletChainId),
  };
}

/**
 * Keeps the wallet on the URL's network. While disconnected, AppKit is kept on it, so that
 * connecting asks the wallet for that network. While connected on another chain, the wallet is
 * asked to switch once for each network the URL moves to; if the user declines, the page stays
 * read-only until `switchWallet` is called. Use it once, in `NetworkWrapper`.
 */
export function useWalletNetworkSync () {
  const { network } = useCurrentNetwork();
  const { isConnected } = useAccount();
  const { isWalletOnUrlNetwork, walletNetwork } = useWalletNetwork();
  const { isPending: isSwitching, switchChainAsync } = useSwitchChain();
  const askedChainId = useRef<number | undefined>(undefined);

  const switchWallet = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: network.chainId });
    } catch (error) {
      const isDeclined = error instanceof BaseError
        && error.walk(cause => cause instanceof UserRejectedRequestError) !== null;
      if (isDeclined) {
        logger.info('The user declined to switch the wallet\'s network');
        return;
      }
      logger.error('Failed to switch the wallet\'s network:', error);
      toast.error(`Your wallet couldn't switch to ${network.displayName}; please switch it in the wallet.`);
    }
  }, [network, switchChainAsync]);

  // AppKit asks the wallet for its own network when connecting, so keep that on the URL's.
  useEffect(() => {
    if (!isConnected) appKit.switchNetwork(network.appKitNetwork);
  }, [isConnected, network]);

  useEffect(() => {
    if (!isConnected) {
      askedChainId.current = undefined;
      return;
    }
    if (isWalletOnUrlNetwork || askedChainId.current === network.chainId) return;

    askedChainId.current = network.chainId;
    switchWallet();
  }, [isConnected, isWalletOnUrlNetwork, network.chainId, switchWallet]);

  return { isSwitching, isWalletOnUrlNetwork, switchWallet, walletNetwork };
}

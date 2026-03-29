import { formatEther } from 'viem';
import { Loader2, Wallet } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useNetwork } from '../hooks/useNetwork';
import { utilityManager } from '../lib/utils';
import Tooltip from './Tooltip';

/**
 * Custom wallet connection button.
 * Shows wallet icon with "Connect wallet" text when disconnected, or wallet icon with native
 * token balance and truncated address when connected. Opens AppKit modal on click.
 */
export default function WalletButton () {
  const { open } = useAppKit();
  const { isConnected, address } = useAccount();
  const { network } = useNetwork();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address as `0x${string}`,
    enabled: isConnected && !!address,
  });

  const handleClick = () => {
    if (isConnected) {
      // Show account view when connected.
      open({ view: 'Account' });
    } else {
      // Show connection view when disconnected.
      open({ view: 'Connect' });
    }
  };

  const tooltipContent = isConnected && address ? `Connected to ${address}` : 'Connect your wallet';

  // Format balance to 4 decimal places.
  const formattedBalance = balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000';

  // Get native currency symbol from chain metadata.
  const nativeCurrencySymbol = network?.chain?.nativeCurrency?.symbol || 'ETH';

  return (
    <Tooltip content={tooltipContent}>
      <button
      className="transition-colors flex items-center justify-center gap-2 bg-card-background hover:bg-white h-12 rounded-r-lg border border-interface-border px-3 text-primary hover:text-primary-interaction"
      onClick={handleClick}
      data-testid="connect-button"
      type="button">
        <Wallet className="size-5 shrink-0" />
        <span className="text-sm font-mono flex items-center gap-1">
          {isConnected && address ? (
            <>
              {isBalanceLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <span>{formattedBalance}<span className="ml-[.2rem] text-xs">{nativeCurrencySymbol}</span></span>
              )}
              <span className="border-l border-input-border pl-1">{utilityManager.shortenAddress(address)}</span>
            </>
          ) : (
            <span className="font-sans font-medium">Connect wallet</span>
          )}
        </span>
      </button>
    </Tooltip>
  );
}

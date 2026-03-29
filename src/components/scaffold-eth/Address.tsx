import clsx from 'clsx';
import Tooltip from '../Tooltip';
import { chainManager } from '../../lib/chain-manager';
import { Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { isAddress } from 'viem';
import { logger } from '../../lib/logger';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { utilityManager } from '../../lib/utils';
import { useAppKitNetworkState } from '../../hooks/useAppKitNetwork';
import { useEnsName } from 'wagmi';

interface AddressProps {
  address: string;
  showCopy?: boolean;
  showFull?: boolean;
  showBlockExplorer?: boolean;
  className?: string;
}

const Address = memo(({
  address,
  showCopy = true,
  showFull = true,
  showBlockExplorer = true,
  className,
}: AddressProps) => {

  const [copied, setCopied] = useState(false);
  const hasInitiallyLoadedRef = useRef(false);
  const { chainId } = useAppKitNetworkState();

  // ENS resolution with safeguards to prevent infinite loops.
  const { data: ensName, isLoading: ensLoading } = useEnsName({
    address: isAddress(address) ? address as `0x${string}` : undefined,
    chainId: 1, // Only resolve on Ethereum mainnet for ENS.
    query: {
      enabled: isAddress(address) && hasInitiallyLoadedRef.current,
      staleTime: 60 * 1000, // Cache for 1 minute.
      refetchOnWindowFocus: false, // Prevent refetch on focus.
      refetchOnMount: false, // Only fetch once per mount.
    },
  });

  const isLoading = ensLoading && !hasInitiallyLoadedRef.current;

  // Compute display address without causing re-renders.
  const displayAddress = useMemo(() => {
    if (isAddress(address)) {
      // Show ENS name if available, otherwise show the address.
      if (ensName && !showFull) {
        return ensName;
      }
      return showFull ? address : utilityManager.shortenAddress(address);
    } else {
      return 'Invalid address';
    }
  }, [address, showFull, ensName]);

  // Mark as initially loaded - this effect only runs once per component instance.
  useEffect(() => {
    if (!hasInitiallyLoadedRef.current) {
      hasInitiallyLoadedRef.current = true;
    }
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy address:', error);
    }
  };

  // Get the block explorer URL for the current chain and address.
  const blockExplorerUrl = chainId ? chainManager.blockExplorerAddressUrl(chainId, address) : undefined;

  // Only show loading spinner on initial load, not during background refetches.
  if (isLoading && !hasInitiallyLoadedRef.current) {
    return <Loader2 className="size-4 animate-spin" />;
  }

  // Determine if the address is truncated.
  const isTruncated = isAddress(address) && !ensName && !showFull;

  return (
    <div className={clsx('flex items-center justify-between gap-2 w-full font-mono', className)}>
      {isTruncated ? (
        <Tooltip content={address}>
          <span className="break-all min-w-0">{displayAddress}</span>
        </Tooltip>
      ) : (
        <span className="break-all min-w-0">{displayAddress}</span>
      )}
      <div className="flex items-center gap-1 shrink-0">
        {showCopy && (
          <Tooltip content="Copy address">
            <button
            onClick={copyToClipboard}
            className="transition-colors cursor-pointer p-1 text-primary hover:text-primary-interaction"
            type="button">
              {copied ? (
                <Check className="size-4 text-success"/>
              ) : (
                <Copy className="transition-colors size-4"/>
              )}
            </button>
          </Tooltip>
        )}
        {showBlockExplorer && isAddress(address) && blockExplorerUrl && (
          <Tooltip content="View on block explorer">
            <a
            className="transition-colors flex cursor-pointer p-1 text-primary hover:text-primary-interaction"
            href={blockExplorerUrl}
            rel="noopener,noreferrer"
            target="_blank">
              <ExternalLink className="transition-colors size-4"/>
            </a>
          </Tooltip>
        )}
      </div>
    </div>
  );
});

export default Address;

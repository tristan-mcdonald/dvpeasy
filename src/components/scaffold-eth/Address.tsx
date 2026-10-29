import clsx from 'clsx';
import Tooltip from '../Tooltip';
import { networkLinks } from '../../lib/network-links';
import { Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { isAddress } from 'viem';
import { memo, useEffect, useMemo, useRef } from 'react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { utilityManager } from '../../lib/utils';
import { useCurrentNetwork } from '../../hooks/useCurrentNetwork';
import { useEnsName } from 'wagmi';

interface AddressProps {
  address: string;
  showCopy?: boolean;
  showFull?: boolean;
  showBlockExplorer?: boolean;
  className?: string;
}

/**
 * An address, or its ENS name, with buttons to copy it and open it in the block explorer.
 */
const Address = memo(({
  address,
  showCopy = true,
  showFull = true,
  showBlockExplorer = true,
  className,
}: AddressProps) => {

  const { copiedText, copy } = useCopyToClipboard();
  const hasInitiallyLoadedRef = useRef(false);
  const { chainId } = useCurrentNetwork().network;

  // ENS names are registered on Ethereum mainnet, whichever network the app is on.
  const { data: ensName, isLoading: ensLoading } = useEnsName({
    address: isAddress(address) ? address as `0x${string}` : undefined,
    chainId: 1,
    query: {
      // Off on the first render, to avoid a render loop.
      enabled: isAddress(address) && hasInitiallyLoadedRef.current,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  });

  const isLoading = ensLoading && !hasInitiallyLoadedRef.current;

  const displayAddress = useMemo(() => {
    if (isAddress(address)) {
      if (ensName && !showFull) {
        return ensName;
      }
      return showFull ? address : utilityManager.shortenAddress(address);
    } else {
      return 'Invalid address';
    }
  }, [address, showFull, ensName]);

  useEffect(() => {
    if (!hasInitiallyLoadedRef.current) {
      hasInitiallyLoadedRef.current = true;
    }
  }, []);

  const blockExplorerUrl = networkLinks.address(chainId, address);

  if (isLoading && !hasInitiallyLoadedRef.current) {
    return <Loader2 className="size-4 animate-spin" />;
  }

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
            onClick={() => copy(address)}
            className="transition-colors cursor-pointer p-1 text-primary hover:text-primary-interaction"
            type="button">
              {copiedText === address ? (
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
            rel="noopener noreferrer"
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

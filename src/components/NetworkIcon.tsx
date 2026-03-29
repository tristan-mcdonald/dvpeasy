import { BaseIcon, EthereumIcon } from './NetworkIcons';
import { NetworkMetadata } from '../config/networks';
import { useNetwork } from '../hooks/useNetwork';

interface NetworkIconProps {
  network?: NetworkMetadata | undefined;
  className?: string;
  useCurrentNetwork?: boolean;
}

/**
 * Network icon component that displays the appropriate network logo or a fallback.
 */
export default function NetworkIcon ({
  network,
  className = 'size-6',
  useCurrentNetwork = false,
}: NetworkIconProps) {
  // Get current network from context if useCurrentNetwork is true.
  const { network: currentNetwork } = useNetwork();

  // Use current network if requested, otherwise use the provided network.
  const displayNetwork = useCurrentNetwork ? currentNetwork : network;

  if (!displayNetwork) {
    return (
      <div className={`${className} rounded-full bg-interface-dark flex items-center justify-center text-white text-xs font-bold`}>
        <span>?</span>
      </div>
    );
  }

  // Display the appropriate icon component based on network ID.
  switch (displayNetwork.id) {
    case 'mainnet':
    case 'sepolia':
      return <EthereumIcon className={className} />;
    case 'base':
    case 'baseSepolia':
      return <BaseIcon className={className} />;
    default:
      // Fallback for networks without dedicated icon components.
      return (
        <div className={`${className} rounded-full bg-interface-dark flex items-center justify-center text-white text-xs font-bold`}>
          <span>{displayNetwork.displayName.charAt(0).toUpperCase()}</span>
        </div>
      );
  }
}

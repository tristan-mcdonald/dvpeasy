import { BaseIcon, EthereumIcon } from './NetworkIcons';
import { Network } from '../config/networks';

interface NetworkIconProps {
  network?: Network | undefined;
  className?: string;
}

/**
 * Network icon component that displays the appropriate network logo or a fallback.
 */
export default function NetworkIcon ({
  network,
  className = 'size-6',
}: NetworkIconProps) {
  if (!network) {
    return (
      <div className={`${className} rounded-full bg-interface-dark flex items-center justify-center text-white text-xs font-bold`}>
        <span>?</span>
      </div>
    );
  }

  // Display the appropriate icon component based on network ID.
  switch (network.id) {
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
          <span>{network.displayName.charAt(0).toUpperCase()}</span>
        </div>
      );
  }
}

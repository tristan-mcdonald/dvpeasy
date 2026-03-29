import BaseSVG from '../assets/icons/networks/base.svg?react';
import EthereumSVG from '../assets/icons/networks/ethereum.svg?react';

/**
 * Network icon components.
 * Each network has its own React component for better performance and security.
 * SVG assets are imported from separate files for easier maintenance.
 */

interface IconProps {
  className?: string;
}

export function BaseIcon ({ className = 'size-6' }: IconProps) {
  return <BaseSVG className={className} />;
}

export function EthereumIcon ({ className = 'size-6' }: IconProps) {
  return <EthereumSVG className={className} />;
}

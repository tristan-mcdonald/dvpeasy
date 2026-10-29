import BaseSVG from '../assets/icons/networks/base.svg?react';
import EthereumSVG from '../assets/icons/networks/ethereum.svg?react';

/**
 * The networks' logos, from the SVG files in `assets/icons/networks/`.
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

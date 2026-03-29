import ArbitrumSVG from '../assets/icons/networks/arbitrum.svg?react';
import AvalancheSVG from '../assets/icons/networks/avalanche.svg?react';
import EthereumSVG from '../assets/icons/networks/ethereum.svg?react';
import PolygonSVG from '../assets/icons/networks/polygon.svg?react';

/**
 * Network icon components.
 * Each network has its own React component for better performance and security.
 * SVG assets are imported from separate files for easier maintenance.
 */

interface IconProps {
  className?: string;
}

export function ArbitrumIcon ({ className = 'size-6' }: IconProps) {
  return <ArbitrumSVG className={className} />;
}

export function AvalancheIcon ({ className = 'size-6' }: IconProps) {
  return <AvalancheSVG className={className} />;
}

export function EthereumIcon ({ className = 'size-6' }: IconProps) {
  return <EthereumSVG className={className} />;
}

export function PolygonIcon ({ className = 'size-6' }: IconProps) {
  return <PolygonSVG className={className} />;
}

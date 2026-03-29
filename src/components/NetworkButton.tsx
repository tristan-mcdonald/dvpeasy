import NetworkIcon from './NetworkIcon';
import NetworkSelectionModal from './NetworkSelectionModal';
import Tooltip from './Tooltip';
import { NETWORKS, networkConfigManager } from '../config/networks';
import { useContractConfig } from '../hooks/useContractConfig';
import { useState } from 'react';

/**
 * Network selection button.
 * Shows current network logo with a tooltip displaying connection status.
 * Opens network selection modal on click.
 */
export default function NetworkButton () {
  const { config } = useContractConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get the network metadata from the contract config's networkId.
  const currentNetwork = config.networkId ? NETWORKS[config.networkId] : undefined;
  const displayName = currentNetwork ? networkConfigManager.displayName(currentNetwork, false) : 'Select network';

  const tooltipText = `Current network: ${displayName}`;

  return (
    <>
      <Tooltip content={tooltipText}>
        <button
        className="transition-colors flex items-center justify-center size-12 border-t border-b border-l border-interface-border bg-card-background hover:bg-white"
          data-testid={`network-select-button-${currentNetwork?.id || 'unknown'}`}
        onClick={() => setIsModalOpen(true)}
        type="button">
          <NetworkIcon network={currentNetwork} />
        </button>
      </Tooltip>
      <NetworkSelectionModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)} />
    </>
  );
}

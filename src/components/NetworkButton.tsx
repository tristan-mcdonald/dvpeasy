import NetworkIcon from './NetworkIcon';
import NetworkSelectionModal from './NetworkSelectionModal';
import Tooltip from './Tooltip';
import { useCurrentNetwork } from '../hooks/useCurrentNetwork';
import { useState } from 'react';

/**
 * The header's button showing the network's logo, which opens the network dialog.
 */
export default function NetworkButton () {
  const { network } = useCurrentNetwork();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Tooltip content={`Current network: ${network.displayName}`}>
        <button
        className="transition-colors flex items-center justify-center size-12 border-t border-b border-l border-interface-border bg-card-background hover:bg-white"
          data-testid={`network-select-button-${network.id}`}
        onClick={() => setIsModalOpen(true)}
        type="button">
          <NetworkIcon network={network} />
        </button>
      </Tooltip>
      <NetworkSelectionModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)} />
    </>
  );
}

import ContractVersionModal from './ContractVersionModal';
import Tooltip from './Tooltip';
import { useCurrentNetwork } from '../hooks/useCurrentNetwork';
import { useState } from 'react';

/**
 * The header's button showing the contract version, which opens the version dialog.
 */
export default function ContractVersionButton () {
  const { version } = useCurrentNetwork().deployment;
  const [ isModalOpen, setIsModalOpen ] = useState(false);

  return (
    <>
      <Tooltip content={`Contract version: ${version.name}`}>
        <button
        className="transition-colors flex items-center justify-center bg-card-background hover:bg-white h-12 border-y border-l border-interface-border px-3 text-primary hover:text-primary-interaction"
        onClick={() => setIsModalOpen(true)}
        type="button">
          <span className="text-sm font-medium">{version.tag}</span>
        </button>
      </Tooltip>
      <ContractVersionModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)} />
    </>
  );
}

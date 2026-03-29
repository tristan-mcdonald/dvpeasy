import ContractVersionModal from './ContractVersionModal';
import Tooltip from './Tooltip';
import { useContractConfig } from '../hooks/useContractConfig';
import { useState } from 'react';

/**
 * Contract version selection button.
 * Displays the current contract version tag as text.
 * Opens a version selection modal dialog on click.
 */
export default function ContractVersionButton () {
  const { currentVersion, availableVersions } = useContractConfig();
  const [ isModalOpen, setIsModalOpen ] = useState(false);


  const currentVersionInfo = availableVersions.find(versionInfo => versionInfo.tag === currentVersion);
  const tooltipText = `Contract version: ${currentVersionInfo?.name || currentVersion}`;

  return (
    <>
      <Tooltip content={tooltipText}>
        <button
        className="transition-colors flex items-center justify-center bg-card-background hover:bg-white h-12 border-y border-l border-interface-border px-3 text-primary hover:text-primary-interaction"
        onClick={() => setIsModalOpen(true)}
        type="button">
          <span className="text-sm font-medium">{currentVersion}</span>
        </button>
      </Tooltip>
      <ContractVersionModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)} />
    </>
  );
}

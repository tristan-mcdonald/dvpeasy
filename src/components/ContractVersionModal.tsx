import ContractDeploymentDate from './ContractDeploymentDate';
import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { Copy, Check, ExternalLink, X } from 'lucide-react';
import { chainManager } from '../lib/chain-manager';
import { logger } from '../lib/logger';
import { utilityManager } from '../lib/utils';
import { useAppKitNetworkState } from '../hooks/useAppKitNetwork';
import { useContractConfig } from '../hooks/useContractConfig';
import { useNetworkManager } from '../hooks/useNetworkManager';

interface ContractVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal dialog for selecting contract versions.
 * Displays available versions for the current network.
 */
export default function ContractVersionModal ({ isOpen, onClose }: ContractVersionModalProps) {
  const { config, availableVersions, currentVersion, getVersionContractAddresses } = useContractConfig();
  const { changeVersion } = useNetworkManager();
  const { chainId } = useAppKitNetworkState();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      logger.error('Failed to copy address:', error);
    }
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleVersionSelect = (version: string) => {
    try {
      // Use the network manager to change version and update URL.
      changeVersion(version);
      logger.info(`Switched to contract version ${version}`);
      onClose();
    } catch (error) {
      logger.error('Failed to switch contract version:', error);
    }
  };

  const hasMultipleVersions = availableVersions.length > 1;
  const versionAddresses = getVersionContractAddresses();

  return (
    <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
    onClick={handleOverlayClick}>
      <div
      className="shadow-standard border border-interface-border rounded-lg w-full max-w-md bg-body-background p-6"
      onClick={(event) => event.stopPropagation()}>
        <header className="flex justify-between items-center border-b border-interface-border pb-4">
          <h2>Select contract version</h2>
          <button
          aria-label="Close smart contract version selection"
          className="transition-colors text-primary-subtle hover:text-primary"
          onClick={onClose}
          type="button">
            <X className="size-6"/>
          </button>
        </header>

        {hasMultipleVersions && (
          <div className="py-4 border-b border-interface-border">
            <p className="text-text-label">Select which version of the DVP contract to use on {config.name}.</p>
          </div>
        )}

        <div className="pt-4">
          <h3 className="text-base font-medium">Contract versions</h3>
            <ul className="mt-3 space-y-3">
              {availableVersions.map((version) => {
                const isSelected = version.tag === currentVersion;
                const addresses = versionAddresses[version.tag];
                return (
                  <li key={version.tag}>
                    <div
                    className={`transition-colors flex items-start gap-3 w-full rounded-lg border border-interface-border shadow-standard bg-card-background p-3 ${
                      !isSelected && 'hover:border-primary-subtle hover:shadow-standard hover:bg-white cursor-pointer'
                    }`}
                    onClick={!isSelected ? () => handleVersionSelect(version.tag) : undefined}>
                      <span className="font-bold text-primary">v{version.tag.replace('v', '')}</span>
                      <div className="flex-1 text-left">
                        {(version.deploymentDate || addresses) && (
                          <dl className="mt-[.3rem] text-xs text-text-label">
                            <ContractDeploymentDate version={version} />
                            {addresses && (
                              <>
                                <div className="mt-2 flex gap-2">
                                  <dt className="flex-[0_0_5.8rem] font-medium">DVP contract:</dt>
                                  <dd className="flex flex-1 items-center gap-2">
                                    <span className="block mr-auto">{utilityManager.shortenAddress(addresses.dvpAddress)}</span>
                                    <Tooltip content="Copy address">
                                      <button
                                      className="transition-colors cursor-pointer text-primary hover:text-primary-interaction"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        copyToClipboard(addresses.dvpAddress);
                                      }}
                                      type="button">
                                        {copiedAddress === addresses.dvpAddress ? (
                                          <Check className="size-3 text-success" />
                                        ) : (
                                          <Copy className="transition-colors size-3" />
                                        )}
                                      </button>
                                    </Tooltip>
                                    <Tooltip content="View on block explorer">
                                      <a
                                      className="transition-colors flex cursor-pointer text-primary hover:text-primary-interaction"
                                      href={chainId ? chainManager.blockExplorerAddressUrl(chainId, addresses.dvpAddress) : '#'}
                                      rel="noopener,noreferrer"
                                      target="_blank"
                                      onClick={(event) => event.stopPropagation()}>
                                        <ExternalLink className="transition-colors size-3"/>
                                      </a>
                                    </Tooltip>
                                  </dd>
                                </div>
                                <div className=" mt-2 flex gap-2">
                                  <dt className="flex-[0_0_5.8rem] font-medium">Helper contract:</dt>
                                  <dd className="flex flex-1 items-center gap-2">
                                    <span className="block mr-auto">{utilityManager.shortenAddress(addresses.dvpHelperAddress)}</span>
                                    <Tooltip content="Copy address">
                                      <button
                                      className="transition-colors cursor-pointer text-primary hover:text-primary-interaction"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        copyToClipboard(addresses.dvpHelperAddress);
                                      }}
                                      type="button">
                                        {copiedAddress === addresses.dvpHelperAddress ? (
                                          <Check className="size-3 text-success" />
                                        ) : (
                                          <Copy className="transition-colors size-3" />
                                        )}
                                      </button>
                                    </Tooltip>
                                    <Tooltip content="View on block explorer">
                                      <a
                                      className="transition-colors flex cursor-pointer text-primary hover:text-primary-interaction"
                                      href={chainId ? chainManager.blockExplorerAddressUrl(chainId, addresses.dvpHelperAddress) : '#'}
                                      rel="noopener,noreferrer"
                                      target="_blank"
                                      onClick={(event) => event.stopPropagation()}>
                                        <ExternalLink className="transition-colors size-3"/>
                                      </a>
                                    </Tooltip>
                                  </dd>
                                </div>
                              </>
                            )}
                          </dl>
                        )}
                      </div>
                      <div className="flex-[0_0_4.8rem] mt-auto mb-auto text-right">
                        {isSelected && (
                          <span className="text-sm text-success">Active</span>
                        )}
                        {version.isDeprecated && (
                          <span className="text-sm text-warning block">Deprecated</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </div>
  );
}

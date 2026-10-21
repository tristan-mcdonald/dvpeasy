import NetworkIcon from './NetworkIcon';
import React from 'react';
import { networks } from '../config/networks';
import { useAccount } from 'wagmi';
import { useNetworkManager } from '../hooks/useNetworkManager';
import { useLocation } from 'react-router-dom';
import { urlManager } from '../lib/url-manager';
import { useTestNetworkSetting } from '../hooks/useTestNetworkSetting';
import { X } from 'lucide-react';

interface NetworkSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal dialog for selecting blockchain networks.
 * Filters available networks based on user's test network preference.
 */
export default function NetworkSelectionModal ({ isOpen, onClose }: NetworkSelectionModalProps) {
  const { showTestNetworks, setShowTestNetworks } = useTestNetworkSetting();
  const { changeNetwork, isLoading } = useNetworkManager();
  const { isConnected } = useAccount();
  const location = useLocation();

  // Parse current network from URL path directly to avoid useParams issues when called from header.
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let urlNetworkId: string | null = null;

  if (pathSegments.length >= 2) {
    const parsed = urlManager.parseNetworkAndVersion({
      network: pathSegments[0],
      version: pathSegments[1],
    });
    urlNetworkId = parsed?.networkId || null;
  }

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleNetworkSelect = async (networkId: string) => {
    try {
      // Change the network in the URL.
      changeNetwork(networkId);
      onClose();
    } catch (error) {
      console.error('Network selection failed:', error);
    }
  };

  const handleTestNetworkToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowTestNetworks(event.target.checked);
  };

  const visibleNetworks = networks.all()
    .filter(network => showTestNetworks || !network.isTestnet)
    .sort((first, second) => first.displayName.localeCompare(second.displayName));
  const networkGroups = [
    { title: 'Mainnet networks', networks: visibleNetworks.filter(network => !network.isTestnet) },
    { title: 'Test networks', networks: visibleNetworks.filter(network => network.isTestnet) },
  ].filter(group => group.networks.length > 0);

  return (
    <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
    onClick={handleOverlayClick}>
      <div
      className="shadow-standard border border-interface-border rounded-lg w-full max-w-md bg-body-background p-6"
      onClick={(event) => event.stopPropagation()}>

        {/* Header */}
        <header className="flex justify-between items-center border-b border-interface-border pb-4">
          <h2>Select network</h2>
          <button
          aria-label="Close network selection"
          className="transition-colors text-primary-subtle hover:text-primary"
          onClick={onClose}
          type="button">
            <X className="size-6"/>
          </button>
        </header>

        {/* Wallet connection info */}
        {isConnected && (
          <div className="pt-6 pb-4 border-b border-interface-border">
            <p className="text-sm">When you switch networks, you will be prompted to connect to that network in your wallet.</p>
          </div>
        )}

        {/* Test networks toggle */}
        <div className="pt-6 pb-4 border-b border-interface-border">
          <div className="flex items-center gap-3">
            <input
            checked={showTestNetworks}
            className="switch switch-primary"
            id="show-test-networks"
            onChange={handleTestNetworkToggle}
            type="checkbox" />
            <label
            className="cursor-pointer"
            htmlFor="show-test-networks">Show test networks</label>
          </div>
          <p className="text-text-label text-sm mt-3">When enabled, test networks will be shown in the network selector.</p>
        </div>

        {/* Network list */}
        {networkGroups.length === 0 ? (
          <div className="text-center">
            <p className="pt-6">No networks available.</p>
            <p className="text-sm mt-2">Enable test networks to see more options.</p>
          </div>
        ) : (
          <div className="pt-4">
            {networkGroups.map((group, groupIndex) => (
              <React.Fragment key={group.title}>
                <h3 className={`text-base font-medium ${groupIndex > 0 ? 'mt-4 ' : ''}mb-2`}>{group.title}</h3>
                <ul className="space-y-1">
                  {group.networks.map((network) => {
                    const isUrlNetwork = network.id === urlNetworkId;

                    return (
                      <li key={network.id}>
                        <button
                        className={`transition-colors flex items-center gap-3 w-full rounded-lg border p-3 ${
                          isUrlNetwork
                            ? 'border-interface-border bg-card-background'
                            : 'border-transparent hover:border-primary-subtle hover:shadow-standard hover:bg-white'
                        }`}
                        disabled={isUrlNetwork || isLoading}
                        onClick={() => handleNetworkSelect(network.id)}
                        type="button">
                          <NetworkIcon network={network} />
                          <div className="flex-1 text-left">
                            <span className="text-primary">{network.displayName}</span>
                          </div>
                          {isUrlNetwork && (
                            <span className="text-sm text-success">Connected</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

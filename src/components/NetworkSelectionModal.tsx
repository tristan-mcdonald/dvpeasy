import NetworkIcon from './NetworkIcon';
import React from 'react';
import { networkConfigManager, NETWORKS } from '../config/networks';
import { networkManager } from '../lib/network-manager';
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

  const {
    mainnetConfigs,
    testnetConfigs,
    hasNoNetworks,
    hasMainnetNetworks,
    hasTestnetNetworks,
  } = networkManager.networkSelectionData(showTestNetworks);


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
        {hasNoNetworks ? (
          <div className="text-center">
            <p className="pt-6">No networks available.</p>
            <p className="text-sm mt-2">Enable test networks to see more options.</p>
          </div>
        ) : (
          <div className="pt-4">
            {/* Mainnet networks */}
            {hasMainnetNetworks && (
              <>
                <h3 className="text-base font-medium mb-2">Mainnet networks</h3>
                <ul className="space-y-1">
                  {mainnetConfigs.map(([key, config]) => {
                    const isUrlNetwork = config.networkId === urlNetworkId;
                    const network = NETWORKS[config.networkId];

                    return (
                      <li key={key}>
                        <button
                        className={`transition-colors flex items-center gap-3 w-full rounded-lg border p-3 ${
                          isUrlNetwork
                            ? 'border-interface-border bg-card-background'
                            : 'border-transparent hover:border-primary-subtle hover:shadow-standard hover:bg-white'
                        }`}
                        disabled={isUrlNetwork || isLoading}
                        onClick={() => handleNetworkSelect(config.networkId)}
                        type="button">
                          <NetworkIcon network={network} />
                          <div className="flex-1 text-left">
                            <span className="text-primary">{networkConfigManager.displayName(network, false)}</span>
                          </div>
                          {isUrlNetwork && (
                            <span className="text-sm text-success">Connected</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* Test networks */}
            {showTestNetworks && hasTestnetNetworks && (
              <>
                <h3 className="text-base font-medium mt-4 mb-2">Test networks</h3>
                <ul className="space-y-1">
                  {testnetConfigs.map(([key, config]) => {
                    const isUrlNetwork = config.networkId === urlNetworkId;
                    const network = NETWORKS[config.networkId];

                    return (
                      <li key={key}>
                        <button
                        className={`transition-colors flex items-center gap-3 w-full rounded-lg border p-3 ${
                          isUrlNetwork
                            ? 'border-interface-border bg-card-background'
                            : 'border-transparent hover:border-primary-subtle hover:shadow-standard hover:bg-white'
                        }`}
                        disabled={isUrlNetwork || isLoading}
                        onClick={() => handleNetworkSelect(config.networkId)}
                        type="button">
                          <NetworkIcon network={network} />
                          <div className="flex-1 text-left">
                            <span className="text-primary">{networkConfigManager.displayName(network, false)}</span>
                          </div>
                          {isUrlNetwork && (
                            <span className="text-sm text-success">Connected</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

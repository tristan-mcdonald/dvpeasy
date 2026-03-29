import { useAppKitNetwork, useAppKit, useAppKitState } from '@reown/appkit/react';
import { useEffect, useState, useRef } from 'react';

/**
 * Hook to monitor AppKit network state with fallback support.
 * This works regardless of wallet connection status and persists across page reloads.
 * Also automatically closes the modal when a network is selected.
 */
export function useAppKitNetworkState () {
  const { caipNetwork, switchNetwork } = useAppKitNetwork();
  const { close } = useAppKit();
  const { open } = useAppKitState();
  const [networkId, setNetworkId] = useState<number | undefined>(undefined);
  const previousNetworkId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (caipNetwork?.id) {
      // Convert CAIP network ID to number if it's a string.
      const id = typeof caipNetwork.id === 'string' ? parseInt(caipNetwork.id) : caipNetwork.id;
      setNetworkId(id);

      // Check if network actually changed and modal is open.
      if (previousNetworkId.current !== undefined &&
          previousNetworkId.current !== id &&
          open) {
        // Close modal dialog after network change.
        close();
      }

      // Update previous network ID for next comparison.
      previousNetworkId.current = id;
    }
  }, [caipNetwork, open, close]);

  return {
    chainId: networkId,
    caipNetwork,
    switchNetwork,
  };
}

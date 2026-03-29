const SETTING_CHANGE_EVENT = 'test-network-setting-changed';
const TEST_NETWORK_SETTING_KEY = 'dvp-show-test-networks';
import { useEffect, useState } from 'react';

/**
 * Hook to manage the user's preference for showing test networks.
 * Stores the setting in localStorage for persistence across sessions.
 * Automatically syncs across all components using this hook.
 */
export function useTestNetworkSetting () {
  const [showTestNetworks, setShowTestNetworks] = useState<boolean>(false);

  // Load initial value from localStorage.
  useEffect(() => {
    const stored = localStorage.getItem(TEST_NETWORK_SETTING_KEY);
    if (stored !== null) {
      setShowTestNetworks(stored === 'true');
    } else {
      // Default to true for development purposes.
      setShowTestNetworks(true);
      localStorage.setItem(TEST_NETWORK_SETTING_KEY, 'true');
    }
  }, []);

  // Listen for changes from other components.
  useEffect(() => {
    const handleSettingChange = () => {
      const stored = localStorage.getItem(TEST_NETWORK_SETTING_KEY);
      if (stored !== null) {
        setShowTestNetworks(stored === 'true');
      }
    };

    // Listen for custom events when setting changes.
    window.addEventListener(SETTING_CHANGE_EVENT, handleSettingChange);

    return () => {
      window.removeEventListener(SETTING_CHANGE_EVENT, handleSettingChange);
    };
  }, []);

  const updateSetting = (value: boolean) => {
    setShowTestNetworks(value);
    localStorage.setItem(TEST_NETWORK_SETTING_KEY, value.toString());

    // Dispatch custom event to notify other components.
    window.dispatchEvent(new CustomEvent(SETTING_CHANGE_EVENT));
  };

  return {
    showTestNetworks,
    setShowTestNetworks: updateSetting,
  };
}

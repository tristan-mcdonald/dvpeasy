const SETTING_CHANGE_EVENT = 'test-network-setting-changed';
const TEST_NETWORK_SETTING_KEY = 'dvp-show-test-networks';
import { useEffect, useState } from 'react';

/**
 * Whether the network list shows test networks, kept in `localStorage`. A window event keeps every
 * component which uses it in step.
 */
export function useTestNetworkSetting () {
  const [showTestNetworks, setShowTestNetworks] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem(TEST_NETWORK_SETTING_KEY);
    if (stored !== null) {
      setShowTestNetworks(stored === 'true');
    } else {
      // Test networks are shown until the user turns them off.
      setShowTestNetworks(true);
      localStorage.setItem(TEST_NETWORK_SETTING_KEY, 'true');
    }
  }, []);

  useEffect(() => {
    const handleSettingChange = () => {
      const stored = localStorage.getItem(TEST_NETWORK_SETTING_KEY);
      if (stored !== null) {
        setShowTestNetworks(stored === 'true');
      }
    };

    window.addEventListener(SETTING_CHANGE_EVENT, handleSettingChange);

    return () => {
      window.removeEventListener(SETTING_CHANGE_EVENT, handleSettingChange);
    };
  }, []);

  const updateSetting = (value: boolean) => {
    setShowTestNetworks(value);
    localStorage.setItem(TEST_NETWORK_SETTING_KEY, value.toString());

    window.dispatchEvent(new CustomEvent(SETTING_CHANGE_EVENT));
  };

  return {
    showTestNetworks,
    setShowTestNetworks: updateSetting,
  };
}

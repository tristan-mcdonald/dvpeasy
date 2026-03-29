import { urlManager } from '../lib/url-manager';
import { contractConfigManager, VERSIONED_CONTRACT_CONFIGS } from '../config/contracts';
import { logger } from '../lib/logger';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';

export interface NetworkManagerState {
  // Current network ID from URL.
  urlNetworkId: string | null;
  // Current version from URL.
  urlVersion: string | null;
  // Error message if network/version is invalid.
  error: string | null;
  // Whether currently processing a network change.
  isLoading: boolean;
}

export interface NetworkManagerActions {
  // Change network and update URL.
  changeNetwork: (networkId: string, version?: string) => void;
  // Change contract version and update URL.
  changeVersion: (version: string) => void;
  // Navigate to a specific network/version URL.
  navigateToNetwork: (networkId: string, version: string) => void;
}

export interface UseNetworkManagerReturn extends NetworkManagerState, NetworkManagerActions {}

/**
 * Manages network navigation logic with proper settlement ID preservation.
 * Encapsulates navigation decisions and loading state management.
 */
class NetworkNavigationManager {
  private navigate: NavigateFunction;
  private setIsLoading: (loading: boolean) => void;

  constructor (navigate: NavigateFunction, setIsLoading: (loading: boolean) => void) {
    this.navigate = navigate;
    this.setIsLoading = setIsLoading;
  }

  /**
   * Extract settlement ID from current URL path.
   */
  #extractSettlementId (): string | null {
    return urlManager.extractSettlementIdFromPath(window.location.pathname);
  }

  /**
   * Navigate to either settlement detail or dashboard based on current page context.
   */
  #navigateToSettlementOrDashboard (networkId: string, version: string): void {
    const settlementId = this.#extractSettlementId();

    if (settlementId) {
      /**
       * For settlement pages, use window.location.href to ensure proper page reload.
       * This guarantees component re-initialization with the new network/version context.
       */
      const newUrl = urlManager.buildSettlementUrl(networkId, version, settlementId);
      window.location.href = newUrl;
    } else {
      // Not on a settlement page, use React Router navigation for better performance.
      const newUrl = urlManager.buildDashboardUrl(networkId, version);
      this.navigate(newUrl, { replace: true });
      logger.info('Changed network/version via URL', { networkId, version });
    }
  }

  /**
   * Change the current network and preserve settlement ID if on a settlement page.
   */
  changeNetwork = (networkId: string, version?: string): void => {
    this.setIsLoading(true);

    try {
      // Always use the default version for the target network when switching networks.
      const networkConfig = VERSIONED_CONTRACT_CONFIGS[networkId];
      if (!networkConfig) {
        logger.error(`No configuration found for network: ${networkId}`);
        return;
      }

      // Use provided version or default to the network's latest version.
      const targetVersion = version || networkConfig.defaultVersion;

      this.#navigateToSettlementOrDashboard(networkId, targetVersion);
    } catch (error) {
      logger.error('Failed to change network:', error);
    } finally {
      this.setIsLoading(false);
    }
  };

  /**
   * Change the current contract version and preserve settlement ID if on a settlement page.
   */
  changeVersion = (version: string): void => {
    this.setIsLoading(true);

    try {
      // Get current network from contract config manager.
      const currentConfig = contractConfigManager.getCurrentConfig();
      const currentNetworkId = currentConfig.networkId;

      if (!currentNetworkId) {
        logger.warn('Cannot change version without a current network');
        return;
      }

      this.#navigateToSettlementOrDashboard(currentNetworkId, version);
    } catch (error) {
      logger.error('Failed to change version:', error);
    } finally {
      this.setIsLoading(false);
    }
  };
}

/**
 * Central network state manager.
 * Provides a unified interface for all URL-based network and version operations.
 * URL is the single source of truth.
 */
export function useNetworkManager (): UseNetworkManagerReturn {
  const params = useParams<{ network?: string; version?: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Parse current URL parameters.
  const urlParams = urlManager.parseNetworkAndVersion(params);
  const urlNetworkId = urlParams?.networkId || null;
  const urlVersion = urlParams?.version || null;

  // Validate URL parameters.
  const error = (params.network && params.version && !urlParams)
    ? `Invalid network "${params.network}" or version "${params.version}"`
    : null;

  // Create navigation manager instance with stable reference.
  const navigationManager = useMemo(
    () => new NetworkNavigationManager(navigate, setIsLoading),
    [navigate],
  );

  const navigateToNetwork = useCallback((networkId: string, version: string) => {
    const url = urlManager.buildDashboardUrl(networkId, version);
    navigate(url, { replace: true });
  }, [navigate]);

  return {
    // State.
    urlNetworkId,
    urlVersion,
    error,
    isLoading,

    // Actions - delegate to class methods.
    changeNetwork: navigationManager.changeNetwork,
    changeVersion: navigationManager.changeVersion,
    navigateToNetwork,
  };
}

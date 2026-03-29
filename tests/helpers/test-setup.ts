import type { Page, BrowserContext } from '@playwright/test';
import { MetaMask } from '@synthetixio/synpress/playwright';
import basicSetup from '../wallet-setup/basic.setup';
import { metaMaskTestManager } from './metamask-helpers';
import { TIMEOUTS, TEST_SELECTORS, NETWORKS } from '../constants/test-config';

/**
 * Configuration for MetaMask test instance.
 */
export interface MetaMaskTestContext {
  metamask: MetaMask;
  page: Page;
  context: BrowserContext;
}

/**
 * Maps network identifiers to their display names in the UI.
 *
 * @param network - The network identifier.
 * @returns The display name for the network.
 */
function getNetworkDisplayName (network: string): string {
  const networkNames: Record<string, string> = {
    [NETWORKS.SEPOLIA]: 'Ethereum Sepolia',
    [NETWORKS.ARBITRUM_SEPOLIA]: 'Arbitrum Sepolia',
    [NETWORKS.POLYGON]: 'Polygon',
  };

  return networkNames[network] || network;
}

/**
 * Test setup management system for application testing.
 * Handles wallet creation, connection flows, navigation, and verification.
 */
export const testSetupManager = {
  /**
   * Creates and initializes a MetaMask instance for testing.
   *
   * @param context - The browser context from the test.
   * @param metamaskPage - The MetaMask extension page.
   * @param extensionId - The MetaMask extension ID.
   * @returns Initialized MetaMask instance.
   */
  createMetaMaskInstance (
    context: BrowserContext,
    metamaskPage: Page,
    extensionId: string,
  ): MetaMask {
    return new MetaMask(
      context,
      metamaskPage,
      basicSetup.walletPassword,
      extensionId,
    );
  },

  /**
   * Sets up a complete wallet connection flow for testing.
   * Handles network selection, wallet connection, and verification.
   *
   * @param page - The application page.
   * @param metamask - The MetaMask instance.
   * @param network - The network to connect to (default: sepolia).
   * @returns Promise that resolves when connection is complete.
   */
  async setupWalletConnection (
    page: Page,
    metamask: MetaMask,
    network: string = NETWORKS.SEPOLIA,
  ): Promise<void> {
    // Select the network.
    await this.selectNetwork(page, network);

    // Initiate wallet connection.
    await page.getByTestId(TEST_SELECTORS.CONNECT_BUTTON).click();
    await page.getByTestId(TEST_SELECTORS.WALLET_SELECTOR_METAMASK).click();

    // Connect MetaMask with network handling.
    await metaMaskTestManager.connectMetaMaskWithNetworkHandling(metamask, page, network);
  },

  /**
   * Selects a network in the application UI.
   *
   * @param page - The application page.
   * @param network - The network identifier to select.
   */
  async selectNetwork (
    page: Page,
    network: string,
  ): Promise<void> {
    // Click on any network button to open the selector.
    const networkButtonPattern = new RegExp(`${TEST_SELECTORS.NETWORK_SELECT_BUTTON}-.*`);
    await page.getByTestId(networkButtonPattern).click();

    // Select the specific network.
    const networkDisplayName = getNetworkDisplayName(network);
    await page.getByRole('button', { name: networkDisplayName }).click({
      timeout: TIMEOUTS.STANDARD,
    });
  },

  /**
   * Navigates to a specific page in the application.
   * Handles both direct navigation and UI-based navigation.
   *
   * @param page - The application page.
   * @param path - The path to navigate to (e.g., '/create', '/dashboard').
   * @param options - Navigation options.
   */
  async navigateToPage (
    page: Page,
    path: string,
    options: {
      useDirectNavigation?: boolean;
      network?: string;
      version?: string;
    } = {},
  ): Promise<void> {
    const {
      useDirectNavigation = false,
      network = NETWORKS.SEPOLIA,
      version = 'latest',
    } = options;

    if (useDirectNavigation) {
      // Direct navigation with network and version.
      const fullPath = `/${network}/${version}${path}`;
      await page.goto(fullPath);
      await page.waitForTimeout(TIMEOUTS.MEDIUM);
    } else {
      // Try UI-based navigation first.
      const linkTexts: Record<string, string> = {
        '/': 'Dashboard',
        '/create': 'Create settlement',
        '/settlements': 'Settlements',
      };

      const linkText = linkTexts[path];
      if (linkText) {
        const link = page.getByText(linkText).first();
        if (await link.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
          await link.click();
          await page.waitForTimeout(TIMEOUTS.MEDIUM);
          return;
        }
      }

      // Fallback to direct navigation if UI navigation fails.
      await this.navigateToPage(page, path, {
        ...options,
        useDirectNavigation: true,
      });
    }
  },

  /**
   * Waits for a page to be fully loaded and ready for interaction.
   *
   * @param page - The application page.
   * @param expectedHeading - Optional heading text to verify the correct page loaded.
   */
  async waitForPageReady (
    page: Page,
    expectedHeading?: string,
  ): Promise<void> {
    // Wait for network to be idle.
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.WALLET_OPERATION });

    // Verify expected heading if provided.
    if (expectedHeading) {
      await page.waitForSelector(`h1:has-text("${expectedHeading}")`, {
        timeout: TIMEOUTS.WALLET_OPERATION,
      });
    }

    // Additional stabilization wait.
    await page.waitForTimeout(TIMEOUTS.SHORT);
  },

  /**
   * Verifies that the wallet is connected and displays the expected state.
   *
   * @param page - The application page.
   * @param expectedNetwork - Optional network to verify.
   * @returns Promise that resolves when verification is complete.
   */
  async verifyWalletConnection (
    page: Page,
    expectedNetwork?: string,
  ): Promise<void> {
    // Verify the connect button shows an address.
    const connectButton = page.getByTestId(TEST_SELECTORS.CONNECT_BUTTON);
    await connectButton.waitFor({ state: 'visible', timeout: TIMEOUTS.STANDARD });

    const buttonText = await connectButton.textContent();
    if (!buttonText || buttonText.includes('Connect wallet')) {
      throw new Error('Wallet does not appear to be connected');
    }

    // Verify network if specified.
    if (expectedNetwork) {
      const networkSelector = `${TEST_SELECTORS.NETWORK_SELECT_BUTTON}-${expectedNetwork}`;
      await page.getByTestId(networkSelector).waitFor({
        state: 'visible',
        timeout: TIMEOUTS.STANDARD,
      });
    }
  },
};

import type { Page, BrowserContext } from '@playwright/test';
import { MetaMask } from '@synthetixio/synpress/playwright';
import basicSetup from '../wallet-setup/basic.setup';
import { metaMaskTestManager } from './metamask-helpers';
import { TIMEOUTS, TEST_SELECTORS, NETWORKS } from '../constants/test-config';

export interface MetaMaskTestContext {
  metamask: MetaMask;
  page: Page;
  context: BrowserContext;
}

/**
 * A network's name in the app's network dialog.
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
 * Steps the end-to-end tests share: connecting MetaMask, choosing a network, and moving between
 * pages.
 */
export const testSetupManager = {
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
   * Picks the network, then connects MetaMask, approving any request to switch network.
   */
  async setupWalletConnection (
    page: Page,
    metamask: MetaMask,
    network: string = NETWORKS.SEPOLIA,
  ): Promise<void> {
    await this.selectNetwork(page, network);

    await page.getByTestId(TEST_SELECTORS.CONNECT_BUTTON).click();
    await page.getByTestId(TEST_SELECTORS.WALLET_SELECTOR_METAMASK).click();

    await metaMaskTestManager.connectMetaMaskWithNetworkHandling(metamask, page, network);
  },

  /**
   * Picks a network in the app's network dialog, unless the app is already on it.
   */
  async selectNetwork (
    page: Page,
    network: string,
  ): Promise<void> {
    const networkButtonPattern = new RegExp(`${TEST_SELECTORS.NETWORK_SELECT_BUTTON}-.*`);
    const networkButton = page.getByTestId(networkButtonPattern);
    await networkButton.waitFor({ state: 'visible', timeout: TIMEOUTS.STANDARD });

    // The selector disables the current network, so there's nothing to click.
    const currentNetworkButton = page.getByTestId(`${TEST_SELECTORS.NETWORK_SELECT_BUTTON}-${network}`);
    if (await currentNetworkButton.isVisible()) return;

    await networkButton.click();

    const networkDisplayName = getNetworkDisplayName(network);
    await page.getByRole('button', { name: networkDisplayName }).click({
      timeout: TIMEOUTS.STANDARD,
    });
  },

  /**
   * Goes to a page through the header's links, or by its URL if it has no link or
   * `useDirectNavigation` is set.
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
      const fullPath = `/${network}/${version}${path}`;
      await page.goto(fullPath);
      await page.waitForTimeout(TIMEOUTS.MEDIUM);
    } else {
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

      await this.navigateToPage(page, path, {
        ...options,
        useDirectNavigation: true,
      });
    }
  },

  /**
   * Waits for the network to go quiet and, if given, for the page's heading.
   */
  async waitForPageReady (
    page: Page,
    expectedHeading?: string,
  ): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.WALLET_OPERATION });

    if (expectedHeading) {
      await page.waitForSelector(`h1:has-text("${expectedHeading}")`, {
        timeout: TIMEOUTS.WALLET_OPERATION,
      });
    }

    await page.waitForTimeout(TIMEOUTS.SHORT);
  },

  /**
   * Throws unless the header shows a connected wallet, and waits for the given network's button.
   */
  async verifyWalletConnection (
    page: Page,
    expectedNetwork?: string,
  ): Promise<void> {
    const connectButton = page.getByTestId(TEST_SELECTORS.CONNECT_BUTTON);
    await connectButton.waitFor({ state: 'visible', timeout: TIMEOUTS.STANDARD });

    const buttonText = await connectButton.textContent();
    if (!buttonText || buttonText.includes('Connect wallet')) {
      throw new Error('Wallet does not appear to be connected');
    }

    if (expectedNetwork) {
      const networkSelector = `${TEST_SELECTORS.NETWORK_SELECT_BUTTON}-${expectedNetwork}`;
      await page.getByTestId(networkSelector).waitFor({
        state: 'visible',
        timeout: TIMEOUTS.STANDARD,
      });
    }
  },
};

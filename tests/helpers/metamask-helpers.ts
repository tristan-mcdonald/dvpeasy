import type { Page } from '@playwright/test';
import { MetaMask } from '@synthetixio/synpress/playwright';
import { METAMASK, TIMEOUTS, TEST_SELECTORS } from '../constants/test-config';

// Set to true to log each step of the MetaMask helpers.
const DEBUG_MODE = false;

function debugLog (message: string): void {
  if (DEBUG_MODE) {
    console.debug(`[MetaMask Helper] ${message}`);
  }
}

/**
 * Clicks MetaMask's confirmation button on a page, if it shows one, and says whether it did.
 */
async function attemptConfirmationClick (
  page: Page,
  description: string,
): Promise<boolean> {
  try {
    const confirmButton = page.locator(METAMASK.SELECTORS.CONFIRMATION_BUTTON);
    const isVisible = await confirmButton.isVisible({ timeout: TIMEOUTS.MEDIUM }).catch(() => false);

    if (isVisible) {
      const buttonText = await confirmButton.textContent().catch(() => 'unknown');
      debugLog(`Found ${description} with button text: "${buttonText}"`);

      await confirmButton.click({ timeout: TIMEOUTS.MEDIUM });
      debugLog(`✓ Clicked ${description}`);
      return true;
    }
  } catch (error) {
    // The page may have closed, or may not be a confirmation.
    debugLog(`Could not interact with ${description}: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  return false;
}

function isMetaMaskPage (url: string): boolean {
  return url.includes('chrome-extension://') || url.includes('notification.html');
}

/**
 * MetaMask's steps for the end-to-end tests.
 */
export const metaMaskTestManager = {
  /**
   * Approves each switch of network MetaMask asks for, which can be more than one, through Synpress
   * and then by clicking the confirmation. Returns how many needed a click.
   */
  async approveNetworkSwitch (
    metamask: MetaMask,
    page: Page,
  ): Promise<number> {
    debugLog('Attempting to approve network switch...');

    let modalCount = 0;
    const context = page.context();

    try {
      await Promise.race([
        metamask.approveSwitchNetwork(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Synpress method timeout')), TIMEOUTS.MEDIUM),
        ),
      ]);
      debugLog('Synpress approveSwitchNetwork succeeded');
      await page.waitForTimeout(TIMEOUTS.SHORT);
    } catch {
      debugLog('Synpress method timed out, falling back to manual approach');
    }

    for (let attempt = 0; attempt < METAMASK.MAX_NETWORK_SWITCH_ATTEMPTS; attempt++) {
      let foundModal = false;

      // MetaMask's prompt can open in a page of its own.
      const allPages = context.pages();
      for (const currentPage of allPages) {
        if (!isMetaMaskPage(currentPage.url())) continue;

        if (await attemptConfirmationClick(
          currentPage,
          `network switch modal #${modalCount + 1}`,
        )) {
          modalCount++;
          foundModal = true;
          await page.waitForTimeout(TIMEOUTS.MEDIUM);
          break;
        }
      }

      // Synpress keeps MetaMask's own page in a property which it doesn't type.
      const metamaskPage = (metamask as unknown as { page?: Page }).page;
      if (!foundModal && metamaskPage) {
        if (await attemptConfirmationClick(
          metamaskPage,
          `network switch modal #${modalCount + 1} on main page`,
        )) {
          modalCount++;
          foundModal = true;
          await page.waitForTimeout(TIMEOUTS.MEDIUM);
        }
      }

      if (!foundModal) {
        debugLog(
          modalCount === 0
            ? 'No network switch modals found'
            : `Successfully handled ${modalCount} network switch modal(s)`,
        );
        break;
      }
    }

    await page.waitForTimeout(TIMEOUTS.SHORT);
    return modalCount;
  },

  /**
   * Connects MetaMask to the app and approves any switch of network, then checks that the header
   * shows the wallet and, if given, the network. The checks only log what they find.
   */
  async connectMetaMaskWithNetworkHandling (
    metamask: MetaMask,
    page: Page,
    expectedNetwork?: string,
  ): Promise<void> {
    debugLog('Connecting MetaMask to dapp...');

    await metamask.connectToDapp();
    debugLog('Initial connection complete');

    const modalsHandled = await this.approveNetworkSwitch(metamask, page);
    debugLog(`Handled ${modalsHandled} network switch modal(s)`);

    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    debugLog('Verifying wallet connection in UI...');
    try {
      await page.waitForFunction(
        (selector) => {
          const button = document.querySelector(`[data-testid="${selector}"]`);
          return button &&
                 button.textContent &&
                 !button.textContent.includes('Connect wallet');
        },
        TEST_SELECTORS.CONNECT_BUTTON,
        { timeout: TIMEOUTS.WALLET_OPERATION },
      );
      debugLog('Wallet connection verified in UI');
    } catch {
      const errorMessage = 'Failed to verify wallet connection in UI';
      debugLog(`Warning: ${errorMessage}`);
      // The test's own assertions decide whether the connection worked.
    }

    if (expectedNetwork) {
      const networkSelector = `${TEST_SELECTORS.NETWORK_SELECT_BUTTON}-${expectedNetwork}`;
      try {
        await page.waitForSelector(
          `[data-testid="${networkSelector}"]`,
          { timeout: TIMEOUTS.STANDARD },
        );
        debugLog(`Confirmed connection on ${expectedNetwork} network`);
      } catch {
        debugLog(`Warning: Could not confirm network is ${expectedNetwork}`);
        // As above, the test's own assertions decide.
      }
    }
  },
};

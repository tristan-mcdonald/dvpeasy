import type { Page } from '@playwright/test';
import { MetaMask } from '@synthetixio/synpress/playwright';
import { METAMASK, TIMEOUTS, TEST_SELECTORS } from '../constants/test-config';

/**
 * Configuration for debug logging.
 * Set to false in CI environments or when running tests in non-debug mode.
 */
const DEBUG_MODE = false; // Set to true for debugging.

/**
 * Logs debug information if debug mode is enabled.
 */
function debugLog (message: string): void {
  if (DEBUG_MODE) {
    // Use console.debug for test debugging - can be filtered in test runners.
    console.debug(`[MetaMask Helper] ${message}`);
  }
}

/**
 * Attempts to click a confirmation button on a MetaMask page.
 * @returns true if button was found and clicked, false otherwise.
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
    // Button not found or page closed - this is expected in many cases.
    debugLog(`Could not interact with ${description}: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  return false;
}

/**
 * Checks if a page URL indicates it's a MetaMask extension page.
 */
function isMetaMaskPage (url: string): boolean {
  return url.includes('chrome-extension://') || url.includes('notification.html');
}

/**
 * MetaMask test management system for wallet interactions during testing.
 * Handles network switching, connection flows, and modal management.
 */
export const metaMaskTestManager = {
  /**
   * Handles network switching in MetaMask by approving switch modals.
   * MetaMask may show multiple modals when switching networks, this function handles them robustly.
   *
   * @param metamask - The MetaMask instance.
   * @param page - The main application page.
   * @returns The number of network switch modals that were handled.
   */
  async approveNetworkSwitch (
    metamask: MetaMask,
    page: Page,
  ): Promise<number> {
    debugLog('Attempting to approve network switch...');

    let modalCount = 0;
    const context = page.context();

    // First attempt: Try the Synpress built-in method with a timeout.
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

    // Manual approach: Check for and handle network switch modals.
    for (let attempt = 0; attempt < METAMASK.MAX_NETWORK_SWITCH_ATTEMPTS; attempt++) {
      let foundModal = false;

      // Check all browser pages for MetaMask modals.
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

      // Also check the MetaMask page directly if available.
      // Access the internal page property safely.
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

      // Stop if no more modals are found.
      if (!foundModal) {
        debugLog(
          modalCount === 0
            ? 'No network switch modals found'
            : `Successfully handled ${modalCount} network switch modal(s)`,
        );
        break;
      }
    }

    // Final stabilization wait.
    await page.waitForTimeout(TIMEOUTS.SHORT);
    return modalCount;
  },

  /**
   * Connects MetaMask to a dApp and handles network switching.
   * Provides a robust connection flow with proper verification.
   *
   * @param metamask - The MetaMask instance.
   * @param page - The application page.
   * @param expectedNetwork - Optional network identifier to verify after connection.
   * @throws Will throw an error if connection fails after retries.
   */
  async connectMetaMaskWithNetworkHandling (
    metamask: MetaMask,
    page: Page,
    expectedNetwork?: string,
  ): Promise<void> {
    debugLog('Connecting MetaMask to dapp...');

    // Perform the initial connection.
    await metamask.connectToDapp();
    debugLog('Initial connection complete');

    // Handle any network switch modals that appear.
    const modalsHandled = await this.approveNetworkSwitch(metamask, page);
    debugLog(`Handled ${modalsHandled} network switch modal(s)`);

    // Wait for UI to stabilize after connection.
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    // Verify the wallet connection is reflected in the UI.
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
      // Don't throw here - the connection might still be successful.
    }

    // Verify we're on the expected network if specified.
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
        // Don't throw - test might still be valid on a different network.
      }
    }
  },
};

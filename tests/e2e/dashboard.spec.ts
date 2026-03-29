import basicSetup from '../wallet-setup/basic.setup';
import { testSetupManager } from '../helpers/test-setup';
import { metaMaskFixtures } from '@synthetixio/synpress/playwright';
import { PATTERNS, NETWORKS, TEST_SELECTORS } from '../constants/test-config';
import { testWithSynpress } from '@synthetixio/synpress';

// Create test suite with Synpress and MetaMask fixtures.
const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

test.describe('Dashboard', () => {
  test('displays settlements after wallet connection and verifies data exists', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // Initialize MetaMask.
    const metamask = testSetupManager.createMetaMaskInstance(context, metamaskPage, extensionId);

    // Navigate to the Dashboard.
    await page.goto('/');

    // Connect wallet to Sepolia network.
    await testSetupManager.setupWalletConnection(page, metamask, NETWORKS.SEPOLIA);

    // Verify wallet connection displays correctly.
    const connectButton = page.getByTestId(TEST_SELECTORS.CONNECT_BUTTON);
    await expect(connectButton).toHaveText(PATTERNS.ETH_ADDRESS_SHORT);

    // Verify correct network is selected.
    const networkButton = page.getByTestId(`${TEST_SELECTORS.NETWORK_SELECT_BUTTON}-${NETWORKS.SEPOLIA}`);
    await expect(networkButton).toBeVisible();

    // Verify settlement data is displayed.
    const settlementTable = page.getByTestId(TEST_SELECTORS.SETTLEMENT_TABLE);
    await expect(settlementTable).toHaveText(PATTERNS.SETTLEMENT_ID);
  });

  test('navigates to settlement details page when clicking settlement ID', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // Initialize MetaMask.
    const metamask = testSetupManager.createMetaMaskInstance(context, metamaskPage, extensionId);

    // Navigate to the Dashboard.
    await page.goto('/');

    // Connect wallet to Sepolia network.
    await testSetupManager.setupWalletConnection(page, metamask, NETWORKS.SEPOLIA);

    // Verify connection is established.
    await testSetupManager.verifyWalletConnection(page, NETWORKS.SEPOLIA);

    // Get the first settlement ID and its text.
    const settlementIdPattern = new RegExp(`${TEST_SELECTORS.SETTLEMENT_ID}-.*`);
    const firstSettlement = page.getByTestId(settlementIdPattern).first();
    const settlementId = await firstSettlement.textContent();

    // Click on the settlement to navigate to details.
    await firstSettlement.click();

    // Verify navigation to settlement details page.
    const expectedHeading = `Settlement ${settlementId}`;
    const settlementHeading = page.getByRole('heading', {
      level: 1,
      name: expectedHeading,
    });
    await expect(settlementHeading).toBeVisible();
  });
});

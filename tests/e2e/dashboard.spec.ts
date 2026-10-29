import basicSetup from '../wallet-setup/basic.setup';
import { testSetupManager } from '../helpers/test-setup';
import { metaMaskFixtures } from '@synthetixio/synpress/playwright';
import { PATTERNS, NETWORKS, TEST_SELECTORS } from '../constants/test-config';
import { testWithSynpress } from '@synthetixio/synpress';

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

test.describe('Dashboard', () => {
  test('displays settlements after wallet connection and verifies data exists', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = testSetupManager.createMetaMaskInstance(context, metamaskPage, extensionId);

    await page.goto('/');

    await testSetupManager.setupWalletConnection(page, metamask, NETWORKS.SEPOLIA);

    const connectButton = page.getByTestId(TEST_SELECTORS.CONNECT_BUTTON);
    await expect(connectButton).toHaveText(PATTERNS.ETH_ADDRESS_SHORT);

    const networkButton = page.getByTestId(`${TEST_SELECTORS.NETWORK_SELECT_BUTTON}-${NETWORKS.SEPOLIA}`);
    await expect(networkButton).toBeVisible();

    const settlementTable = page.getByTestId(TEST_SELECTORS.SETTLEMENT_TABLE);
    await expect(settlementTable).toHaveText(PATTERNS.SETTLEMENT_ID);
  });

  test('navigates to settlement details page when clicking settlement ID', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    const metamask = testSetupManager.createMetaMaskInstance(context, metamaskPage, extensionId);

    await page.goto('/');

    await testSetupManager.setupWalletConnection(page, metamask, NETWORKS.SEPOLIA);

    await testSetupManager.verifyWalletConnection(page, NETWORKS.SEPOLIA);

    const settlementIdPattern = new RegExp(`${TEST_SELECTORS.SETTLEMENT_ID}-.*`);
    const firstSettlement = page.getByTestId(settlementIdPattern).first();
    const settlementId = await firstSettlement.textContent();

    await firstSettlement.click();

    const expectedHeading = `Settlement ${settlementId}`;
    const settlementHeading = page.getByRole('heading', {
      level: 1,
      name: expectedHeading,
    });
    await expect(settlementHeading).toBeVisible();
  });
});

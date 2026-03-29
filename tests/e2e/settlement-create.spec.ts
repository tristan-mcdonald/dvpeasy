import basicSetup from '../wallet-setup/basic.setup';
import type { Page } from '@playwright/test';
import { testSetupManager } from '../helpers/test-setup';
import { metaMaskFixtures } from '@synthetixio/synpress/playwright';
import { NETWORKS, TEST_SELECTORS, TEST_WALLETS, TIMEOUTS } from '../constants/test-config';
import { testWithSynpress } from '@synthetixio/synpress';

// Create test suite with Synpress and MetaMask fixtures.
const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

/**
 * Token flow configuration for settlement creation.
 */
interface TokenFlow {
  fromAddress: string;
  toAddress: string;
  tokenName: string;
  amount: string;
}

/**
 * Adds a token flow to the settlement.
 *
 * @param page - The application page.
 * @param flow - The token flow configuration.
 */
async function addTokenFlow (
  page: Page,
  flow: TokenFlow,
): Promise<void> {
  // Open the add token flow modal.
  await page.getByRole('button', { name: 'Add token flow' }).click();

  // Verify modal is open.
  const modalHeading = page.getByRole('heading', {
    level: 2,
    name: 'Add a token flow',
  });
  await expect(modalHeading).toBeVisible();

  // Fill in the token flow details.
  await page.getByLabel('From address').fill(flow.fromAddress);
  await page.getByLabel('To address').fill(flow.toAddress);

  // Select token from dropdown.
  await page.getByLabel('Token address').click();
  await page.getByRole('button', { name: flow.tokenName }).click({
    timeout: TIMEOUTS.STANDARD,
  });

  // Enter amount.
  await page.getByLabel('Amount').fill(flow.amount);

  // Submit the flow.
  const addFlowButton = page.getByRole('button', { name: 'Add flow' });
  await expect(addFlowButton).toBeEnabled();
  await addFlowButton.click();

  // Verify modal closed.
  await expect(page.getByRole('button', { name: 'Add token flow' })).toBeVisible();
}

/**
 * Creates a settlement with the specified token flows.
 *
 * @param page - The application page.
 * @param flows - Array of token flows to add.
 * @param reference - Optional reference for the settlement.
 * @returns The settlement reference that was created.
 */
async function createSettlement (
  page: Page,
  flows: TokenFlow[],
  reference?: string,
): Promise<string> {
  // Add all token flows.
  for (const flow of flows) {
    await addTokenFlow(page, flow);
  }

  // Generate reference if not provided.
  const settlementReference = reference || `Settlement #${crypto.randomUUID().slice(0, 8)}`;
  await page.getByLabel('Settlement reference').fill(settlementReference);

  // Submit the settlement.
  await page.getByRole('button', { name: 'Create settlement' }).click({
    timeout: TIMEOUTS.STANDARD,
  });

  return settlementReference;
}

test.describe('Settlement Creation', () => {
  test('creates a multi-party settlement with ETH and USDC flows', async ({
    context,
    page,
    metamaskPage,
    extensionId,
  }) => {
    // Set extended timeout for transaction mining.
    test.setTimeout(TIMEOUTS.TEST_MAX);

    // Initialize MetaMask.
    const metamask = testSetupManager.createMetaMaskInstance(context, metamaskPage, extensionId);

    // Navigate to the Dashboard.
    await page.goto('/');

    // Navigate to Create Settlement page.
    await page.getByText('Create settlement').click();

    // Connect wallet to Sepolia network.
    await testSetupManager.setupWalletConnection(page, metamask, NETWORKS.SEPOLIA);

    // Ensure we're on the Create Settlement page.
    await testSetupManager.navigateToPage(page, '/create', {
      network: NETWORKS.SEPOLIA,
    });

    // Wait for the page to be ready.
    await testSetupManager.waitForPageReady(page, 'Create settlement');

    // Define the token flows for the settlement.
    const tokenFlows: TokenFlow[] = [
      {
        fromAddress: TEST_WALLETS.ADDRESS_1,
        toAddress: TEST_WALLETS.ADDRESS_2,
        tokenName: 'ETH ETH Ethereum',
        amount: '0.01',
      },
      {
        fromAddress: TEST_WALLETS.ADDRESS_2,
        toAddress: TEST_WALLETS.ADDRESS_1,
        tokenName: 'USDC USDC USD Coin (Test)',
        amount: '4000',
      },
    ];

    // Create the settlement.
    const settlementReference = await createSettlement(page, tokenFlows);

    // Confirm the transaction in MetaMask.
    await metamask.confirmTransaction();

    // Wait for transaction to be mined and success message to appear.
    const successMessage = page.getByText('Settlement created successfully!');
    await expect(successMessage).toBeVisible({
      timeout: TIMEOUTS.TRANSACTION_MINING,
    });

    // Verify we're redirected to the settlement details page.
    const detailsHeading = page.getByRole('heading', {
      level: 2,
      name: 'Settlement details',
    });
    await expect(detailsHeading).toBeVisible();

    // Verify the settlement reference is displayed.
    await expect(page.getByText(settlementReference)).toBeVisible();

    // Verify the settlement status.
    await expect(page.getByText('Pending')).toBeVisible();

    // Verify the token flows are displayed correctly.
    const flowsList = page.getByTestId(TEST_SELECTORS.SETTLEMENT_FLOWS_LIST);
    const ethFlow = flowsList.locator('li').nth(0);
    const usdcFlow = flowsList.locator('li').nth(1);

    // Build patterns for flow verification.
    const ethFlowPattern = new RegExp(
      `${TEST_WALLETS.ADDRESS_1_SHORT}.*${TEST_WALLETS.ADDRESS_2_SHORT}.*0x0000…000000.*0\\.01 ETH`,
    );
    const usdcFlowPattern = new RegExp(
      `${TEST_WALLETS.ADDRESS_2_SHORT}.*${TEST_WALLETS.ADDRESS_1_SHORT}.*0x94a9…d5E4C8.*4000 USDC`,
    );

    await expect(ethFlow).toHaveText(ethFlowPattern);
    await expect(usdcFlow).toHaveText(usdcFlowPattern);
  });

});

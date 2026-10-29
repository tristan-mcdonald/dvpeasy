import basicSetup from '../wallet-setup/basic.setup';
import type { Page } from '@playwright/test';
import { testSetupManager } from '../helpers/test-setup';
import { metaMaskFixtures } from '@synthetixio/synpress/playwright';
import { NETWORKS, TEST_SELECTORS, TEST_WALLETS, TIMEOUTS } from '../constants/test-config';
import { testWithSynpress } from '@synthetixio/synpress';

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

interface TokenFlow {
  fromAddress: string;
  toAddress: string;
  tokenName: string;
  amount: string;
}

/**
 * Adds a flow through the flow dialog.
 */
async function addTokenFlow (
  page: Page,
  flow: TokenFlow,
): Promise<void> {
  await page.getByRole('button', { name: 'Add token flow' }).click();

  const modalHeading = page.getByRole('heading', {
    level: 2,
    name: 'Add a token flow',
  });
  await expect(modalHeading).toBeVisible();

  await page.getByLabel('From address').fill(flow.fromAddress);
  await page.getByLabel('To address').fill(flow.toAddress);

  await page.getByLabel('Token address').click();
  await page.getByRole('button', { name: flow.tokenName }).click({
    timeout: TIMEOUTS.STANDARD,
  });

  await page.getByLabel('Amount').fill(flow.amount);

  const addFlowButton = page.getByRole('button', { name: 'Add flow' });
  await expect(addFlowButton).toBeEnabled();
  await addFlowButton.click();

  await expect(page.getByRole('button', { name: 'Add token flow' })).toBeVisible();
}

/**
 * Adds the flows and submits the form with the reference given, or a random one, which it returns.
 */
async function createSettlement (
  page: Page,
  flows: TokenFlow[],
  reference?: string,
): Promise<string> {
  for (const flow of flows) {
    await addTokenFlow(page, flow);
  }

  const settlementReference = reference || `Settlement #${crypto.randomUUID().slice(0, 8)}`;
  await page.getByLabel('Settlement reference').fill(settlementReference);

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
    // Long enough for the transaction to be mined.
    test.setTimeout(TIMEOUTS.TEST_MAX);

    const metamask = testSetupManager.createMetaMaskInstance(context, metamaskPage, extensionId);

    await page.goto('/');

    await page.getByText('Create settlement').click();

    await testSetupManager.setupWalletConnection(page, metamask, NETWORKS.SEPOLIA);

    await testSetupManager.navigateToPage(page, '/create', {
      network: NETWORKS.SEPOLIA,
    });

    await testSetupManager.waitForPageReady(page, 'Create settlement');

    const tokenFlows: TokenFlow[] = [
      {
        fromAddress: TEST_WALLETS.ADDRESS_1,
        toAddress: TEST_WALLETS.ADDRESS_2,
        tokenName: 'ETH Ethereum',
        amount: '0.01',
      },
      {
        fromAddress: TEST_WALLETS.ADDRESS_2,
        toAddress: TEST_WALLETS.ADDRESS_1,
        tokenName: 'USDC USD Coin (Test)',
        amount: '4000',
      },
    ];

    const settlementReference = await createSettlement(page, tokenFlows);

    await metamask.confirmTransaction();

    const successMessage = page.getByText('Settlement created successfully!');
    await expect(successMessage).toBeVisible({
      timeout: TIMEOUTS.TRANSACTION_MINING,
    });

    const detailsHeading = page.getByRole('heading', {
      level: 2,
      name: 'Settlement details',
    });
    await expect(detailsHeading).toBeVisible();

    await expect(page.getByText(settlementReference)).toBeVisible();

    await expect(page.getByText('Pending')).toBeVisible();

    const flowsList = page.getByTestId(TEST_SELECTORS.SETTLEMENT_FLOWS_LIST);
    const ethFlow = flowsList.locator('li').nth(0);
    const usdcFlow = flowsList.locator('li').nth(1);

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

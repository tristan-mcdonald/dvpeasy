// Import necessary Synpress modules.
import { defineWalletSetup } from '@synthetixio/synpress';
import { getExtensionId, MetaMask } from '@synthetixio/synpress/playwright';

// Define a test seed phrase and password and a WALLET_PRIVATE_KEY.
const WALLET_SEED_PHRASE: string = process.env.WALLET_SEED_PHRASE || 'test test test test test test test test test test test junk';
const WALLET_PASSWORD: string = process.env.WALLET_PASSWORD || 'Tester@1234';
const WALLET_PRIVATE_KEY: string = process.env.WALLET_PRIVATE_KEY || '';  // This should be the private key for address 0x2f…98710F on Sepolia testnet.

// Define the basic wallet setup.
export default defineWalletSetup(WALLET_PASSWORD, async (context, walletPage) => {
  /**
   * Taken directly from the docs https://docs.synpress.io/docs/guides/wallet-cache#metamask-6
   * This is a workaround for the fact that the MetaMask extension ID changes, and this ID is
   * required to detect the pop-ups. It won't be needed in the near future! 😇
   */
  const extensionId = await getExtensionId(context, 'MetaMask');
  // Create a new MetaMask instance.
  const metamask = new MetaMask(context, walletPage, WALLET_PASSWORD, extensionId);

  // Import the wallet using the seed phrase.
  await metamask.importWallet(WALLET_SEED_PHRASE);
  if (WALLET_PRIVATE_KEY) {
    await metamask.importWalletFromPrivateKey(WALLET_PRIVATE_KEY);
  }

  /**
   * Additional setup steps can be added here, such as:
   * - Adding custom networks
   * - Importing tokens
   * - Setting up specific account states
   */
});

import { defineWalletSetup } from '@synthetixio/synpress';
import { getExtensionId, MetaMask } from '@synthetixio/synpress/playwright';

// The public Hardhat test wallet, unless the environment gives another.
const WALLET_SEED_PHRASE: string = process.env.WALLET_SEED_PHRASE || 'test test test test test test test test test test test junk';
const WALLET_PASSWORD: string = process.env.WALLET_PASSWORD || 'Tester@1234';
const WALLET_PRIVATE_KEY: string = process.env.WALLET_PRIVATE_KEY || ''; // Optional: a funded Sepolia account to import as well.

// Synpress names its wallet cache by a hash of this function without its comments, so a change to
// its code means rebuilding the cache with `yarn test:e2e:setup-wallet`.
export default defineWalletSetup(WALLET_PASSWORD, async (context, walletPage) => {
  // MetaMask's extension ID changes, and Synpress needs it to find MetaMask's pop-ups. See
  // https://docs.synpress.io/docs/guides/wallet-cache#metamask-6.
  const extensionId = await getExtensionId(context, 'MetaMask');
  const metamask = new MetaMask(context, walletPage, WALLET_PASSWORD, extensionId);

  await metamask.importWallet(WALLET_SEED_PHRASE);
  if (WALLET_PRIVATE_KEY) {
    await metamask.importWalletFromPrivateKey(WALLET_PRIVATE_KEY);
  }
});

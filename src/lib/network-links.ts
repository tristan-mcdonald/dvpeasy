import { getAddress, zeroAddress } from 'viem';
import { logger } from './logger';
import { networks } from '../config/networks';

const TRUST_WALLET_ASSETS_URL = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';

/**
 * Links to pages outside the app for a network: its block explorer, faucet, NFT marketplace and
 * token logos. Each returns `undefined` for a chain ID which isn't a supported network.
 */
export const networkLinks = {
  address (chainId: number, address: string): string | undefined {
    const network = networks.byChainId(chainId);
    return network && `${network.blockExplorerUrl}/address/${address}`;
  },

  faucet (chainId: number): string | undefined {
    return networks.byChainId(chainId)?.faucetUrl;
  },

  /**
   * An NFT's page on a marketplace, for main networks only.
   */
  nft (chainId: number, contractAddress: string, tokenId: string): string | undefined {
    const network = networks.byChainId(chainId);
    if (!network || network.isTestnet) return undefined;
    return network.nftUrlTemplate
      .replace('{contract}', contractAddress)
      .replace('{token}', tokenId);
  },

  /**
   * Trust Wallet's logo for a token, which it files under the checksummed address.
   */
  tokenLogo (chainId: number, tokenAddress: string): string | undefined {
    const network = networks.byChainId(chainId);
    if (!network) return undefined;

    const chainAssetsUrl = `${TRUST_WALLET_ASSETS_URL}/${network.trustWalletFolder}`;
    if (tokenAddress.toLowerCase() === zeroAddress) return `${chainAssetsUrl}/info/logo.png`;

    try {
      return `${chainAssetsUrl}/assets/${getAddress(tokenAddress)}/logo.png`;
    } catch (error) {
      logger.warn(`Invalid token address for Trust Wallet URL generation: ${tokenAddress}`, error);
      return undefined;
    }
  },
};

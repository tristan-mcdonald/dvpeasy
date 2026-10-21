import type { AppKitNetwork } from '@reown/appkit/networks';
import {
  base as appKitBase,
  baseSepolia as appKitBaseSepolia,
  mainnet as appKitMainnet,
  sepolia as appKitSepolia,
} from '@reown/appkit/networks';
import type { Address, Chain } from 'viem';
import {
  base as viemBase,
  baseSepolia as viemBaseSepolia,
  mainnet as viemMainnet,
  sepolia as viemSepolia,
} from 'viem/chains';
import { SEPOLIA_TEST_TOKENS } from '../data/testnet-tokens/sepolia';
import { zeroAddress } from 'viem';

export type NetworkId = 'base' | 'baseSepolia' | 'mainnet' | 'sepolia';

export interface TokenDetails {
  address: Address;
  decimals: number;
  name: string;
  symbol: string;
}

export interface Network {
  id: NetworkId;
  appKitNetwork: AppKitNetwork;
  blockExplorerUrl: string;
  chain: Chain;
  chainId: number;
  displayName: string;
  faucetUrl?: string;
  isTestnet: boolean;
  nativeToken: TokenDetails;
  /** OpenSea's page for an NFT, with `{contract}` and `{token}` placeholders. */
  nftUrlTemplate: string;
  rpcUrl: string;
  /** The tokens offered on a test network, which token APIs don't list. */
  testTokens?: TokenDetails[];
  /** The chain's folder in Trust Wallet's assets repository, which serves token logos. */
  trustWalletFolder: string;
}

/**
 * The native token of every supported network.
 */
const ETHER: TokenDetails = {
  address: zeroAddress,
  decimals: 18,
  name: 'Ethereum',
  symbol: 'ETH',
};

/**
 * Alchemy's RPC URL for a network, which needs the `VITE_ALCHEMY_API_KEY` environment variable.
 */
function alchemyUrl (subdomain: string): string {
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ALCHEMY_API_KEY environment variable is required');
  }
  return `https://${subdomain}.g.alchemy.com/v2/${apiKey}`;
}

export const DEFAULT_NETWORK_ID: NetworkId = 'sepolia';

export const NETWORKS: Record<NetworkId, Network> = {
  base: {
    id: 'base',
    appKitNetwork: appKitBase,
    blockExplorerUrl: 'https://basescan.org',
    chain: viemBase,
    chainId: viemBase.id,
    displayName: 'Base',
    isTestnet: false,
    nativeToken: ETHER,
    nftUrlTemplate: 'https://opensea.io/item/base/{contract}/{token}',
    rpcUrl: alchemyUrl('base-mainnet'),
    trustWalletFolder: 'base',
  },
  baseSepolia: {
    id: 'baseSepolia',
    appKitNetwork: appKitBaseSepolia,
    blockExplorerUrl: 'https://sepolia.basescan.org',
    chain: viemBaseSepolia,
    chainId: viemBaseSepolia.id,
    displayName: 'Base Sepolia',
    faucetUrl: 'https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet',
    isTestnet: true,
    nativeToken: ETHER,
    nftUrlTemplate: 'https://testnets.opensea.io/assets/base-sepolia/{contract}/{token}',
    rpcUrl: alchemyUrl('base-sepolia'),
    trustWalletFolder: 'base',
  },
  mainnet: {
    id: 'mainnet',
    appKitNetwork: appKitMainnet,
    blockExplorerUrl: 'https://etherscan.io',
    chain: viemMainnet,
    chainId: viemMainnet.id,
    displayName: 'Ethereum',
    isTestnet: false,
    nativeToken: ETHER,
    nftUrlTemplate: 'https://opensea.io/item/ethereum/{contract}/{token}',
    rpcUrl: alchemyUrl('eth-mainnet'),
    trustWalletFolder: 'ethereum',
  },
  sepolia: {
    id: 'sepolia',
    appKitNetwork: appKitSepolia,
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    chain: viemSepolia,
    chainId: viemSepolia.id,
    displayName: 'Ethereum Sepolia',
    faucetUrl: 'https://sepoliafaucet.com',
    isTestnet: true,
    nativeToken: ETHER,
    nftUrlTemplate: 'https://testnets.opensea.io/assets/sepolia/{contract}/{token}',
    rpcUrl: alchemyUrl('eth-sepolia'),
    testTokens: SEPOLIA_TEST_TOKENS,
    trustWalletFolder: 'ethereum',
  },
};

export const networks = {
  all (): Network[] {
    return Object.values(NETWORKS);
  },

  byChainId (chainId: number): Network | undefined {
    return networks.all().find(network => network.chainId === chainId);
  },

  /**
   * The network with this ID, or `undefined` for a string which isn't one, such as from a URL.
   */
  byId (networkId: string): Network | undefined {
    return networks.all().find(network => network.id === networkId);
  },

  /**
   * The network's name, followed by "(DEV)" for a test network or "(PROD)" for a main one.
   */
  nameWithEnvironment (network: Network): string {
    return `${network.displayName} (${network.isTestnet ? 'DEV' : 'PROD'})`;
  },
};

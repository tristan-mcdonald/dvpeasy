import { createAppKit } from '@reown/appkit/react';
import { fallback } from 'wagmi';
import { networkConfigManager } from './networks';
import { http } from 'viem';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = '0619625fb6f38086eb78783c95fdca06';

const metadata = {
  name: 'DVP Settlement',
  description: 'DVP Settlement Interface',
  url: window.location.origin,
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const { appKitNetworks } = networkConfigManager.networkArrays();
const networkTransports = networkConfigManager.networkTransports();

// Generate transports configuration from network data.
const transports = Object.entries(networkTransports).reduce((accumulator, [chainId, rpcUrl]) => ({
  ...accumulator,
  [Number(chainId)]: fallback([http(rpcUrl)]),
}), {});

const wagmiAdapter = new WagmiAdapter({
  networks: appKitNetworks,
  projectId,
  transports,
});

createAppKit({
  adapters: [wagmiAdapter],
  enableNetworkSwitch: false,
  networks: appKitNetworks,
  metadata: metadata,
  projectId,
  themeMode: 'dark',
  features: {
    analytics: true,
  },
  themeVariables: {
    '--w3m-accent': 'var(--color-primary)',
    '--w3m-color-mix': 'var(--color-primary)',
    '--w3m-color-mix-strength': 20,
    '--w3m-font-family': "'Geist', system-ui, -apple-system, sans-serif",
  },
});

export const config = wagmiAdapter.wagmiConfig;

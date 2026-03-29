/**
 * Arbitrum Sepolia testnet token database.
 */
export const arbitrumSepoliaTokens = {
  chainId: 421614,
  chainName: 'Arbitrum Sepolia',
  faucetUrl: 'https://bridge.arbitrum.io',
  tokens: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    {
      address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
      symbol: 'USDC',
      name: 'USD Coin (Test)',
      decimals: 6,
    },
    {
      address: '0x8FB1E3fC51F3b789dED7557E680551d93Ea9d892',
      symbol: 'USDT',
      name: 'Tether USD (Test)',
      decimals: 6,
    },
    {
      address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
      symbol: 'WETH',
      name: 'Wrapped Ether (Test)',
      decimals: 18,
    },
    {
      address: '0xb1D4538B4571d411F07960EF2838Ce337FE1E80E',
      symbol: 'LINK',
      name: 'Chainlink Token (Test)',
      decimals: 18,
    },
    {
      address: '0x3f770Ac673856F105b586bb393d122721265aD46',
      symbol: 'DAI',
      name: 'Dai Stablecoin (Test)',
      decimals: 18,
    },
  ],
} as const;

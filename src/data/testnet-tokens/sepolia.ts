/**
 * Sepolia testnet token database.
 */
export const sepoliaTokens = {
  chainId: 11155111,
  chainName: 'Sepolia Testnet',
  faucetUrl: 'https://sepoliafaucet.com',
  tokens: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
    },
    {
      address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
      symbol: 'USDC',
      name: 'USD Coin (Test)',
      decimals: 6,
    },
    {
      address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      symbol: 'USDT',
      name: 'Tether USD (Test)',
      decimals: 6,
    },
    {
      address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
      symbol: 'DAI',
      name: 'Dai Stablecoin (Test)',
      decimals: 18,
    },
    {
      address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      symbol: 'WETH',
      name: 'Wrapped Ether (Test)',
      decimals: 18,
    },
    {
      address: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      symbol: 'LINK',
      name: 'Chainlink Token (Test)',
      decimals: 18,
    },
    {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI',
      name: 'Uniswap (Test)',
      decimals: 18,
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin (Test)',
      decimals: 8,
    },
  ],
} as const;

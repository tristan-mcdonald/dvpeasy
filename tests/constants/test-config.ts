/** In milliseconds. */
export const TIMEOUTS = {
  SHORT: 1000,
  MEDIUM: 2000,
  STANDARD: 5000,
  WALLET_OPERATION: 10000,
  TRANSACTION_MINING: 30000,
  TEST_MAX: 60000,
} as const;

/** The public Hardhat test wallet, its first two accounts, and how the app shortens them. */
export const TEST_WALLETS = {
  SEED_PHRASE: 'test test test test test test test test test test test junk',
  PASSWORD: 'Tester@1234',
  ADDRESS_1: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  ADDRESS_2: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  ADDRESS_1_SHORT: '0xf39F…b92266',
  ADDRESS_2_SHORT: '0x7099…dc79C8',
} as const;

export const TEST_SELECTORS = {
  CONNECT_BUTTON: 'connect-button',
  NETWORK_SELECT_BUTTON: 'network-select-button',
  WALLET_SELECTOR_METAMASK: 'wallet-selector-io.metamask',
  SETTLEMENT_TABLE: 'settlement-table',
  SETTLEMENT_ID: 'settlement-id',
  SETTLEMENT_FLOWS_LIST: 'settlement-flows-list',
  CONFIRMATION_SUBMIT_BUTTON: 'confirmation-submit-button',
} as const;

export const NETWORKS = {
  SEPOLIA: 'sepolia',
  ARBITRUM_SEPOLIA: 'arbitrum-sepolia',
  POLYGON: 'polygon',
} as const;

export const PATTERNS = {
  ETH_ADDRESS_SHORT: /0x[\da-fA-F]{4}…[\da-fA-F]{6}/,
  SETTLEMENT_ID: /#[0-9]+/,
} as const;

export const METAMASK = {
  MAX_NETWORK_SWITCH_ATTEMPTS: 3,
  SELECTORS: {
    CONFIRMATION_BUTTON: '[data-testid="confirmation-submit-button"]',
  },
} as const;

/**
 * Test configuration constants.
 */

/** Timeout configurations in milliseconds. */
export const TIMEOUTS = {
  /** Short wait for immediate UI updates. */
  SHORT: 1000,
  /** Medium wait for network operations. */
  MEDIUM: 2000,
  /** Standard timeout for element visibility. */
  STANDARD: 5000,
  /** Extended timeout for wallet operations. */
  WALLET_OPERATION: 10000,
  /** Timeout for transaction mining. */
  TRANSACTION_MINING: 30000,
  /** Maximum test timeout. */
  TEST_MAX: 60000,
} as const;

/** Test wallet addresses from the default seed phrase. */
export const TEST_WALLETS = {
  /** Default test seed phrase. */
  SEED_PHRASE: 'test test test test test test test test test test test junk',
  /** Default wallet password. */
  PASSWORD: 'Tester@1234',
  /** First address from the default seed phrase. */
  ADDRESS_1: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  /** Second address from the default seed phrase. */
  ADDRESS_2: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  /** Shortened format for ADDRESS_1. */
  ADDRESS_1_SHORT: '0xf39F…b92266',
  /** Shortened format for ADDRESS_2. */
  ADDRESS_2_SHORT: '0x7099…dc79C8',
} as const;

/** Common test data-testid selectors. */
export const TEST_SELECTORS = {
  CONNECT_BUTTON: 'connect-button',
  NETWORK_SELECT_BUTTON: 'network-select-button',
  WALLET_SELECTOR_METAMASK: 'wallet-selector-io.metamask',
  SETTLEMENT_TABLE: 'settlement-table',
  SETTLEMENT_ID: 'settlement-id',
  SETTLEMENT_FLOWS_LIST: 'settlement-flows-list',
  CONFIRMATION_SUBMIT_BUTTON: 'confirmation-submit-button',
} as const;

/** Network identifiers. */
export const NETWORKS = {
  SEPOLIA: 'sepolia',
  ARBITRUM_SEPOLIA: 'arbitrum-sepolia',
  POLYGON: 'polygon',
} as const;

/** Regular expression patterns for validation. */
export const PATTERNS = {
  /** Matches any Ethereum address in shortened format (0x1234...5678). */
  ETH_ADDRESS_SHORT: /0x[\da-fA-F]{4}…[\da-fA-F]{6}/,
  /** Matches any settlement ID format (#123). */
  SETTLEMENT_ID: /#[0-9]+/,
} as const;

/** MetaMask-specific constants. */
export const METAMASK = {
  /** Maximum number of network switch modals to handle. */
  MAX_NETWORK_SWITCH_ATTEMPTS: 3,
  /** Selectors for MetaMask UI elements. */
  SELECTORS: {
    CONFIRMATION_BUTTON: '[data-testid="confirmation-submit-button"]',
  },
} as const;

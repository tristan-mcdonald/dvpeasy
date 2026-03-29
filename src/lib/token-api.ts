/**
 * Token API types and interfaces.
 *
 * This file contains only the essential token metadata interface and types used throughout the
 * application. The actual API integration logic is in the `useTokenData` hook, to eliminate
 * duplicate 1Inch API calls.
 *
 * @example
 * ```typescript
 * import { TokenMetadata } from './token-api';
 * ```
 */

/**
 * Token metadata interface with essential token information.
 */
export interface TokenMetadata {
  /** Token contract address. */
  address: string;
  /** Token symbol (e.g., 'USDC'). */
  symbol: string;
  /** Full token name (e.g., 'USD Coin'). */
  name: string;
  /** Blockchain network ID. */
  chainId: number;
  /** Number of decimal places for the token. */
  decimals?: number;
  /** TrustWallet logo URL. */
  trustWalletLogoUrl?: string;
  /** Token logo URL. */
  logoUrl?: string;
  /** Last updated timestamp. */
  lastUpdated?: number;
}

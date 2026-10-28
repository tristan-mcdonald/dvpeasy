/**
 * A token from the token list: the 1inch API's, a test network's, or one the user added.
 */
export interface ListedToken {
  address: string;
  symbol: string;
  name: string;
  chainId: number;
  decimals?: number;
  trustWalletLogoUrl?: string;
  logoUrl?: string;
  lastUpdated?: number;
}

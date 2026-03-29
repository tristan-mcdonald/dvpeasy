/**
 * Shared utilities and constants for token-related components.
 * Provides consistent sizing, styling, and type definitions across token components.
 */

/**
 * Available size variants for token-related components.
 */
export type TokenSizeVariant = 'sm' | 'md' | 'lg';

/**
 * CSS class mappings for different token component sizes.
 * Used consistently across token logos, icons, and other sized elements.
 */
export const TOKEN_SIZE_CLASSES: Record<TokenSizeVariant, string> = {
  sm: 'size-6',
  md: 'size-8',
  lg: 'size-10',
};

/**
 * CSS class mappings for icon sizes within token components.
 * Used for icons displayed inside token logo containers.
 */
export const TOKEN_ICON_SIZE_CLASSES: Record<TokenSizeVariant, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

/**
 * Common button styling classes for token-related actions.
 */
export const TOKEN_BUTTON_CLASSES = {
  base: 'flex cursor-pointer transition-colors p-1',
  primary: 'text-primary hover:text-primary-interaction',
  remove: 'rounded transition-colors',
} as const;

/**
 * Common input and container styling classes.
 */
export const TOKEN_CONTAINER_CLASSES = {
  input: 'input-standard !rounded-b-none pr-10',
  dropdown: 'bg-white absolute z-50 max-h-56 w-full overflow-y-auto border border-t-0 border-interface-border shadow-standard rounded !rounded-t-none ring-4 ring-input-outline-focus',
  details: 'rounded !rounded-t-none border border-t-0 border-input-border bg-input-background text-sm',
  listItem: 'w-full px-3 py-2 hover:bg-card-background flex items-center gap-3',
} as const;

/**
 * Symbol mapping for wrapped/testnet tokens.
 * Maps token symbols to their canonical counterparts for icon resolution.
 */
export const TOKEN_SYMBOL_MAP: Record<string, string> = {
  taave: 'aave',
  tdai: 'dai',
  tlink: 'link',
  tuni: 'uni',
  tusd: 'usdt',
  tusdc: 'usdc',
  tusdt: 'usdt',
  twbtc: 'btc',
  tweth: 'eth',
  waave: 'aave',
  wbtc: 'btc',
  weth: 'eth',
  wuni: 'uni',
} as const;

/**
 * Utility function to get the appropriate size classes for a given variant.
 *
 * @param size - The size variant to get classes for
 * @returns Object containing container and icon size classes
 */
export const getTokenSizeClasses = (size: TokenSizeVariant = 'sm') => ({
  container: TOKEN_SIZE_CLASSES[size],
  icon: TOKEN_ICON_SIZE_CLASSES[size],
});

/**
 * Utility function to normalize token symbols for icon lookup.
 *
 * @param symbol - The original token symbol
 * @returns The normalized symbol for icon resolution
 */
export const normalizeTokenSymbol = (symbol?: string): string => {
  if (!symbol) return '';
  const normalized = symbol.toLowerCase();
  return TOKEN_SYMBOL_MAP[normalized] || normalized;
};

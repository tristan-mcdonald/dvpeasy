/**
 * Sizes and classes shared by the token selector's components.
 */

export type TokenSizeVariant = 'sm' | 'md' | 'lg';

const TOKEN_SIZE_CLASSES: Record<TokenSizeVariant, string> = {
  sm: 'size-6',
  md: 'size-8',
  lg: 'size-10',
};

const TOKEN_ICON_SIZE_CLASSES: Record<TokenSizeVariant, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
};

export const TOKEN_BUTTON_CLASSES = {
  base: 'flex cursor-pointer transition-colors p-1',
  primary: 'text-primary hover:text-primary-interaction',
  remove: 'rounded transition-colors',
} as const;

export const TOKEN_CONTAINER_CLASSES = {
  input: 'input-standard !rounded-b-none pr-10',
  dropdown: 'bg-white absolute z-50 max-h-56 w-full overflow-y-auto border border-t-0 border-interface-border shadow-standard rounded !rounded-t-none ring-4 ring-input-outline-focus',
  details: 'rounded !rounded-t-none border border-t-0 border-input-border bg-input-background text-sm',
  listItem: 'w-full px-3 py-2 hover:bg-card-background flex items-center gap-3',
} as const;

/**
 * Test and wrapped tokens' symbols, by the symbol whose icon in `public/icons/tokens/` they share.
 */
const TOKEN_SYMBOL_MAP: Record<string, string> = {
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

export const getTokenSizeClasses = (size: TokenSizeVariant = 'sm') => ({
  container: TOKEN_SIZE_CLASSES[size],
  icon: TOKEN_ICON_SIZE_CLASSES[size],
});

/**
 * The symbol to look a token's icon up by, in lower case.
 */
export const normalizeTokenSymbol = (symbol?: string): string => {
  if (!symbol) return '';
  const normalized = symbol.toLowerCase();
  return TOKEN_SYMBOL_MAP[normalized] || normalized;
};

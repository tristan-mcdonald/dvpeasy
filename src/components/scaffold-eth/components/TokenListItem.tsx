import { Check } from 'lucide-react';
import { memo, ReactNode } from 'react';
import { TOKEN_CONTAINER_CLASSES } from '../utils/tokenSizeUtils';
import { TokenLogoResolver } from './TokenLogoResolver';
import { TokenMetadata } from '../../../lib/token-api';

/**
 * Props for the TokenListItem component.
 */
interface TokenListItemProps {
  /** Token metadata to display */
  token: TokenMetadata;
  /** Currently selected token value for comparison */
  selectedValue: string;
  /** Whether this is a custom token */
  isCustomToken: boolean;
  /** Callback when token is selected */
  onSelect: (token: TokenMetadata) => void;
  /** Optional additional actions (e.g., remove button for custom tokens) */
  actions?: ReactNode;
}

/**
 * TokenListItem component for rendering individual token entries in dropdowns.
 *
 * Provides consistent rendering for both custom and available tokens with:
 * - Token logo with fallback system
 * - Symbol and name display
 * - Token address display
 * - Selection indicator
 * - Optional action buttons
 *
 * Features:
 * - Consistent styling and interaction patterns
 * - Support for additional actions (remove, etc.)
 * - Selection state indication
 * - Memoized for performance optimization
 *
 * @param props - Component props
 * @returns JSX element representing a selectable token list item
 *
 * @example
 * ```tsx
 * <TokenListItem
 * token={tokenMetadata}
 * selectedValue="0x123…"
 * isCustomToken={false}
 * onSelect={handleTokenSelect} />
 * ```
 */
export const TokenListItem = memo<TokenListItemProps>(({
  token,
  selectedValue,
  isCustomToken,
  onSelect,
  actions,
}) => {
  const isSelected = selectedValue.toLowerCase() === token.address.toLowerCase();

  return (
    <div className={`${TOKEN_CONTAINER_CLASSES.listItem} ${actions ? 'justify-between' : ''}`}>
      <button
      className="flex items-center gap-3 flex-1 text-left"
      onClick={() => onSelect(token)}
      type="button">
        <TokenLogoResolver
        isCustomToken={isCustomToken}
        size="sm"
        token={token} />

        <div className="flex-1">
          <span className="block font-medium">{token.symbol}</span>
          <span className="block text-xs text-text-label">{token.name}</span>
        </div>

        <div className="mt-auto text-right">
            <span className="block text-xs text-text-label">{token.address}</span>
        </div>

        {isSelected && (
          <Check className="size-4 text-success" />
        )}
      </button>

      {actions && (
        <div className="flex items-center">
          {actions}
        </div>
      )}
    </div>
  );
});

TokenListItem.displayName = 'TokenListItem';

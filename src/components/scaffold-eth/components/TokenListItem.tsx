import { Check } from 'lucide-react';
import { ListedToken } from '../../../types/tokens';
import { memo, ReactNode } from 'react';
import { TOKEN_CONTAINER_CLASSES } from '../utils/tokenSizeUtils';
import { TokenLogoResolver } from './TokenLogoResolver';

interface TokenListItemProps {
  token: ListedToken;
  selectedValue: string;
  isCustomToken: boolean;
  onSelect: (token: ListedToken) => void;
  actions?: ReactNode;
}

/**
 * A token in the selector's dropdown, with a tick if it's the selected one, and any actions, such
 * as removing a custom token, beside it.
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

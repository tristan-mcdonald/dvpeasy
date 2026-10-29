import Tooltip from '../../Tooltip';
import { AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { ListedToken } from '../../../types/tokens';
import { TOKEN_BUTTON_CLASSES } from '../utils/tokenSizeUtils';
import { TokenListItem } from './TokenListItem';

interface TokenDropdownProps {
  customTokens: ListedToken[];
  listedTokens: ListedToken[];
  networkName: string;
  searchText: string;
  selectedValue: string;
  isLoading: boolean;
  hasError: boolean;
  onSelect: (token: ListedToken) => void;
  onRemoveCustomToken: (token: ListedToken) => void;
  onRetry: () => void;
}

/**
 * The contents of the token selector's dropdown: the user's custom tokens, then the network's tokens or the search
 * results, with loading and error states.
 */
export function TokenDropdown ({
  customTokens,
  listedTokens,
  networkName,
  searchText,
  selectedValue,
  isLoading,
  hasError,
  onSelect,
  onRemoveCustomToken,
  onRetry,
}: TokenDropdownProps) {
  const isSearching = searchText.trim().length > 0;

  if (isLoading) {
    return (
      <div className="px-3 py-4">
        <div className="flex items-center gap-2 text-sm text-label">
          <Loader2 className="size-4 animate-spin" />
          <span>
            {isSearching ? 'Searching tokens…' : 'Loading tokens…'}
          </span>
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
          className="flex items-center gap-3 px-3 py-2 animate-pulse"
          key={index}>
            <div className="size-6 bg-attention rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-attention rounded mb-1"></div>
              <div className="h-3 bg-attention rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="px-3 py-4">
        <div className="flex items-center gap-2 text-sm text-error mb-2">
          <AlertCircle className="size-4" />
          <span>{isSearching ? 'Search failed' : 'Failed to load tokens'}</span>
        </div>
        <button
        className="btn btn-sm btn-ghost gap-2"
        onClick={() => isSearching ? undefined : onRetry()}
        type="button">
          <RefreshCw className="size-3" />
          Retry
        </button>
      </div>
    );
  }

  if (customTokens.length === 0 && listedTokens.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-text-label">
        {isSearching ? `No tokens found matching "${searchText}"` : 'No tokens available'}
      </div>
    );
  }

  return (
    <>
      {customTokens.length > 0 && (
        <>
          <div className="text-xs text-text-label mx-3 py-2 font-medium border-b border-interface-border">
            Your custom tokens ({customTokens.length})
          </div>
          {customTokens.map(token => (
            <TokenListItem
            actions={
              <Tooltip content="Remove custom token">
                <button
                className={`p-1 ${TOKEN_BUTTON_CLASSES.remove}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveCustomToken(token);
                }}
                type="button">
                  <X className="size-3 text-error" />
                </button>
              </Tooltip>
            }
            isCustomToken={true}
            key={`custom-${token.address}-${token.chainId}`}
            onSelect={onSelect}
            selectedValue={selectedValue}
            token={token} />
          ))}
        </>
      )}

      {listedTokens.length > 0 && (
        <>
          <div className="text-xs text-text-label mx-3 py-2 font-medium border-b border-interface-border">
            {isSearching ? `Search results (${listedTokens.length})` : `Tokens (${networkName})`}
          </div>
          {listedTokens.map(token => (
            <TokenListItem
            isCustomToken={false}
            key={`token-${token.address}-${token.chainId}`}
            onSelect={onSelect}
            selectedValue={selectedValue}
            token={token} />
          ))}
        </>
      )}
    </>
  );
}

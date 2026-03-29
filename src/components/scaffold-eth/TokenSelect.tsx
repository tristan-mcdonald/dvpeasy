import LabelWithIcon from '../LabelWithIcon';
import Tooltip from '../Tooltip';
import { AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { forwardRef, ReactNode } from 'react';
import { chainManager } from '../../lib/chain-manager';
import { isAddress } from 'viem';
import { TokenMetadata } from '../../lib/token-api';
import { tokenStorage } from '../../lib/custom-token-storage';
import { useAccount, useChainId } from 'wagmi';
import { useDebounce } from 'use-debounce';
import { useTokenData } from '../../hooks/useTokenData';

// Extracted components.
import { TokenDetailsContent } from './components/TokenDetailsContent';
import { TokenListItem } from './components/TokenListItem';

// Custom hooks.
import { useTokenBalance } from './hooks/useTokenBalance';
import { useTokenSelection } from './hooks/useTokenSelection';

// Utilities.
import { TOKEN_CONTAINER_CLASSES, TOKEN_BUTTON_CLASSES } from './utils/tokenSizeUtils';

/**
 * Props for the TokenSelect component.
 */
interface TokenSelectProps {
  /** Current selected token value (address) */
  value: string;
  /** Callback when token selection changes */
  onChange: (value: string) => void;
  /** Label text for the input field */
  label: string;
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Optional icon to display with the label */
  icon?: ReactNode;
  /** Optional address to check balance for (overrides connected address) */
  addressForBalance?: string;
  /** Error message to display */
  error?: string | null;
}

/**
 * TokenSelect component for selecting tokens with comprehensive search and management features.
 *
 * Provides token selection with:
 * - Real-time search across available tokens
 * - Custom token management (add/remove)
 * - Balance display for selected tokens
 * - Token logo display with fallback system
 * - Clipboard integration and blockchain explorer links
 *
 * @param props - Component props
 * @returns JSX element representing the token selection interface
 *
 * @example
 * ```tsx
 * <TokenSelect
 * value={selectedToken}
 * onChange={setSelectedToken}
 * label="Select Token"
 * placeholder="Search tokens or enter address…"
 * addressForBalance="0x123…"
 * error={validationError} />
 * ```
 */
export const TokenSelect = forwardRef<HTMLInputElement, TokenSelectProps>(({
  value,
  onChange,
  label,
  placeholder = 'Search tokens or enter address…',
  icon,
  addressForBalance,
  error,
}, ref) => {
  const { address } = useAccount();
  const chainId = useChainId();

  // Use addressForBalance if provided, otherwise fall back to connected address.
  const balanceAddress = addressForBalance || address;

  const [debouncedAddress] = useDebounce(value, 500);

  // Token selection state and handlers.
  const {
    inputValue,
    isDropdownOpen,
    comboBoxRef,
    handleInputChange,
    handleTokenSelect,
    setIsDropdownOpen,
    isCustomToken,
    handleRemoveCustomToken,
    getStoredTokenData,
  } = useTokenSelection({ value, onChange });

  // Token balance and metadata.
  const {
    tokenSymbol,
    isLoadingSymbol,
    assetType,
    nftBalance,
    isLoadingNftBalance,
    userBalance,
    isLoadingBalance,
  } = useTokenBalance({
    address: debouncedAddress,
    balanceAddress,
    storedTokenData: getStoredTokenData(),
  });

  // Unified token data that provides both dropdown tokens and search functionality.
  const {
    tokens: availableTokens,
    searchTokens,
    isLoading: isLoadingTokenData,
    error: tokenDataError,
    refetch: refetchTokenData,
  } = useTokenData(chainId, 100);

  // Perform search when user types in input.
  const isSearching = inputValue.trim().length > 0;
  const searchResults = isSearching
    ? searchTokens(inputValue, { limit: 20, includeCustomTokens: true })
    : null;

  /**
   * Saves a valid address as a custom token if it has a symbol and isn't already saved.
   */
  const saveCustomTokenIfNeeded = (address: string) => {
    if (isAddress(address) && tokenSymbol && chainId) {
      const existingTokens = availableTokens || [];
      const isExisting = existingTokens.some((existingToken: TokenMetadata) =>
        existingToken.address.toLowerCase() === address.toLowerCase(),
      );

      if (!isExisting) {
        const newToken: TokenMetadata = {
          address,
          symbol: tokenSymbol,
          name: tokenSymbol,
          chainId,
        };

        tokenStorage.addCustomTokenForChain(newToken, chainId);
      }
    }
  };

  /**
   * Handles token selection from dropdown and saves as custom token if needed.
   */
  const handleTokenSelectWithStorage = (token: TokenMetadata) => {
    handleTokenSelect(token);
    saveCustomTokenIfNeeded(token.address);
  };

  /**
   * Handles input changes and saves valid addresses as custom tokens.
   */
  const handleInputChangeWithStorage = (newValue: string) => {
    handleInputChange(newValue);
    saveCustomTokenIfNeeded(newValue);
  };

  // Determine which tokens to display in dropdown.
  const allTokensToDisplay = isSearching
    ? searchResults?.tokens || []
    : availableTokens || [];

  // Separate custom tokens from tokens list for better organisation.
  const { customTokensToDisplay, tokensToDisplay } = allTokensToDisplay.reduce(
    (acc: { customTokensToDisplay: TokenMetadata[]; tokensToDisplay: TokenMetadata[] }, token: TokenMetadata) => {
      if (isCustomToken(token)) {
        acc.customTokensToDisplay.push(token);
      } else {
        acc.tokensToDisplay.push(token);
      }
      return acc;
    },
    { customTokensToDisplay: [] as TokenMetadata[], tokensToDisplay: [] as TokenMetadata[] },
  );

  const isLoadingTokens = isLoadingTokenData;
  const hasError = tokenDataError;

  return (
    <div className="flex-auto">
      {/* Label. */}
      {icon ? (
        <LabelWithIcon icon={<span className="size-4">{icon}</span>} htmlFor='tokenAddress'>{label}</LabelWithIcon>
      ) : (
        <label className="block label mb-2">{label}</label>
      )}

      {/* Token input with dropdown. */}
      <div
      className="relative w-full"
      ref={comboBoxRef}>
        <div className="relative">
          <input
          className={TOKEN_CONTAINER_CLASSES.input}
          onChange={(event) => handleInputChangeWithStorage(event.target.value)}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={placeholder}
          ref={ref}
          name='tokenAddress'
          id="tokenAddress"
          type="text"
          value={inputValue} />
          {value && (
            <button
            className={`transition-colors absolute end-3 top-1/2 -translate-y-1/2 p-1 text-primary-subtle hover:text-primary ${TOKEN_BUTTON_CLASSES.remove}`}
            onClick={() => onChange('')}
            type="button">
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Dropdown select list. */}
        {isDropdownOpen && (
          <div className={TOKEN_CONTAINER_CLASSES.dropdown}>
            {/* Loading state. */}
            {isLoadingTokens && (
              <div className="px-3 py-4">
                <div className="flex items-center gap-2 text-sm text-label">
                  <Loader2 className="size-4 animate-spin" />
                  <span>
                    {isSearching ? 'Searching tokens…' : 'Loading tokens…'}
                  </span>
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                  className="flex items-center gap-3 px-3 py-2 animate-pulse"
                  key={i}>
                    <div className="size-6 bg-attention rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-attention rounded mb-1"></div>
                      <div className="h-3 bg-attention rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state. */}
            {hasError && !isLoadingTokens && (
              <div className="px-3 py-4">
                <div className="flex items-center gap-2 text-sm text-error mb-2">
                  <AlertCircle className="size-4" />
                  <span>{isSearching ? 'Search failed' : 'Failed to load tokens'}</span>
                </div>
                <button
                className="btn btn-sm btn-ghost gap-2"
                onClick={() => isSearching ? undefined : refetchTokenData()}
                type="button">
                  <RefreshCw className="size-3" />
                  Retry
                </button>
              </div>
            )}

            {/* Token list. */}
            {!isLoadingTokens && !hasError && (
              <>
                {customTokensToDisplay.length > 0 || tokensToDisplay.length > 0 ? (
                  <>
                    {/* User's custom tokens section .*/}
                    {customTokensToDisplay.length > 0 && (
                      <>
                        <div className="text-xs text-text-label mx-3 py-2 font-medium border-b border-interface-border">
                          Your custom tokens ({customTokensToDisplay.length})
                        </div>
                        {customTokensToDisplay.map((token: TokenMetadata) => (
                          <TokenListItem
                          actions={
                            <Tooltip content="Remove custom token">
                              <button
                              className={`p-1 ${TOKEN_BUTTON_CLASSES.remove}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveCustomToken(token.address, refetchTokenData);
                              }}
                              type="button">
                                <X className="size-3 text-error" />
                              </button>
                            </Tooltip>
                          }
                          isCustomToken={true}
                          key={`custom-${token.address}-${token.chainId}`}
                          onSelect={handleTokenSelectWithStorage}
                          selectedValue={value}
                          token={token} />
                        ))}
                      </>
                    )}

                    {/* Tokens section. */}
                    {tokensToDisplay.length > 0 && (
                      <>
                        <div className="text-xs text-text-label mx-3 py-2 font-medium border-b border-interface-border">
                          {isSearching
                            ? `Search results (${tokensToDisplay.length})`
                            : `Tokens (${chainManager.chainName(chainId)})`
                          }
                        </div>
                        {tokensToDisplay.map((token: TokenMetadata) => (
                          <TokenListItem
                          isCustomToken={false}
                          key={`token-${token.address}-${token.chainId}`}
                          onSelect={handleTokenSelectWithStorage}
                          selectedValue={value}
                          token={token} />
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  <div className="px-3 py-4 text-center text-text-label">
                    {isSearching
                      ? `No tokens found matching "${inputValue}"`
                      : 'No tokens available'
                    }
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Token details. */}
      <div className={TOKEN_CONTAINER_CLASSES.details}>
        {isAddress(debouncedAddress) ? (
          isLoadingSymbol ? (
            <div className="px-4 py-2 flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Loading token details…</span>
            </div>
          ) : (
            <TokenDetailsContent
            addressForBalance={addressForBalance}
            assetType={assetType}
            balanceAddress={balanceAddress}
            chainId={chainId}
            debouncedAddress={debouncedAddress}
            isCustomToken={isCustomToken({
              address: debouncedAddress,
              symbol: tokenSymbol,
              name: tokenSymbol,
              chainId,
            })}
            isLoadingBalance={isLoadingBalance}
            isLoadingNftBalance={isLoadingNftBalance}
            nftBalance={nftBalance}
            storedTokenData={getStoredTokenData()}
            tokenSymbol={tokenSymbol}
            userBalance={userBalance} />
          )
        ) : (
          <span className="block px-4 py-2 text-text-label">
            {inputValue ? '↑ Please enter a valid token address' : '↑ Search by name, symbol, or address'}
          </span>
        )}
      </div>

      {/* Testnet notices. */}
      {chainManager.isTestnetChain(chainId) && (
        <span className="block !mt-2 text-xs text-text-label">
          You're on a test network. You can get test tokens{' '}
          <a
          className="link link-primary"
          href={chainManager.testnetFaucetUrl(chainId)}
          target="_blank">here</a>.
        </span>
      )}

      {/* Error display. */}
      {error && (
        <span className="block !mt-2 text-error font-xs">{error}</span>
      )}


    </div>

  );
});

TokenSelect.displayName = 'TokenSelect';

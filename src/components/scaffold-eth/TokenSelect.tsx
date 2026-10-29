import LabelWithIcon from '../LabelWithIcon';
import { Loader2, X } from 'lucide-react';
import { forwardRef, ReactNode } from 'react';
import { networkLinks } from '../../lib/network-links';
import { isAddress } from 'viem';
import { networks } from '../../config/networks';
import { useAccount } from 'wagmi';
import { useCurrentNetwork } from '../../hooks/useCurrentNetwork';
import { useDebounce } from 'use-debounce';
import { useTokenData } from '../../hooks/useTokenData';

// Extracted components.
import { TokenDetailsContent } from './components/TokenDetailsContent';
import { TokenDropdown } from './components/TokenDropdown';

// Custom hooks.
import { useSaveCustomToken } from './hooks/useSaveCustomToken';
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
  const { chainId } = useCurrentNetwork().network;

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

  useSaveCustomToken({
    address: debouncedAddress,
    symbol: tokenSymbol,
    assetType,
    listedTokens: availableTokens,
    isLoadingList: isLoadingTokenData,
  });

  // The dropdown lists the user's custom tokens apart from the network's.
  const allTokensToDisplay = isSearching ? searchResults?.tokens || [] : availableTokens || [];
  const customTokensToDisplay = allTokensToDisplay.filter(isCustomToken);
  const tokensToDisplay = allTokensToDisplay.filter(token => !isCustomToken(token));

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
          onChange={(event) => handleInputChange(event.target.value)}
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

        {isDropdownOpen && (
          <TokenDropdown
          customTokens={customTokensToDisplay}
          hasError={Boolean(tokenDataError)}
          isLoading={isLoadingTokenData}
          listHeading={`Tokens (${networks.byChainId(chainId)?.displayName ?? `Chain ${chainId}`})`}
          listedTokens={tokensToDisplay}
          onRemoveCustomToken={token => handleRemoveCustomToken(token.address, refetchTokenData)}
          onRetry={refetchTokenData}
          onSelect={handleTokenSelect}
          searchText={inputValue}
          selectedValue={value} />
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
      {networks.byChainId(chainId)?.isTestnet && (
        <span className="block !mt-2 text-xs text-text-label">
          You're on a test network. You can get test tokens{' '}
          <a
          className="link link-primary"
          href={networkLinks.faucet(chainId)}
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

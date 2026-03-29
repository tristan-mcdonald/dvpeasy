import type { RefObject } from 'react';
import { isAddress } from 'viem';
import { TokenMetadata } from '../../../lib/token-api';
import { tokenStorage } from '../../../lib/custom-token-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChainId } from 'wagmi';

/**
 * Internal interface for stored token data.
 */
interface StoredTokenData {
  address: string;
  symbol?: string;
  name?: string;
  chainId?: number;
  logoUrl?: string;
  trustWalletLogoUrl?: string;
}

/**
 * Props for the useTokenSelection hook.
 */
interface UseTokenSelectionProps {
  /** Current selected token value */
  value: string;
  /** Callback when token selection changes */
  onChange: (value: string) => void;
}

/**
 * Return type for the useTokenSelection hook.
 */
interface UseTokenSelectionReturn {
  /** Current input value */
  inputValue: string;
  /** Whether the dropdown is open */
  isDropdownOpen: boolean;
  /** Ref for the combobox container */
  comboBoxRef: RefObject<HTMLDivElement>;
  /** Handle input value changes */
  handleInputChange: (newValue: string) => void;
  /** Handle token selection from dropdown */
  handleTokenSelect: (token: TokenMetadata) => void;
  /** Set dropdown open state */
  setIsDropdownOpen: (open: boolean) => void;
  /** Get custom tokens for current chain */
  getCustomTokens: () => TokenMetadata[];
  /** Check if a token is custom */
  isCustomToken: (token: TokenMetadata) => boolean;
  /** Remove a custom token */
  handleRemoveCustomToken: (tokenAddress: string, onSuccess?: () => void) => void;
  /** Get stored token data for the current value */
  getStoredTokenData: () => StoredTokenData | null;
}

/**
 * Custom hook for managing token selection state and interactions.
 *
 * Provides:
 * - Input value synchronization and management
 * - Dropdown visibility state control
 * - Token selection handlers
 * - Custom token management operations
 * - Network change handling
 * - Click outside detection for dropdown
 *
 * @param props - Hook configuration
 * @returns Object containing selection state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   inputValue,
 *   isDropdownOpen,
 *   handleInputChange,
 *   handleTokenSelect
 * } = useTokenSelection({
 *   value: selectedToken,
 *   onChange: setSelectedToken
 * });
 * ```
 */
export const useTokenSelection = ({
  value,
  onChange,
}: UseTokenSelectionProps): UseTokenSelectionReturn => {
  const chainId = useChainId();

  // State for UI and token selection.
  const [inputValue, setInputValue] = useState(value);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const comboBoxRef = useRef<HTMLDivElement>(null);

  // State for storing token metadata from dropdown selections.
  const [storedTokenData, setStoredTokenData] = useState<StoredTokenData | null>(null);

  // Track whether we're in the middle of user input to prevent circular updates.
  const isUserTypingRef = useRef(false);

  /**
   * Update input value when prop changes from external sources.
   * This ensures the input stays in sync with external value changes.
   * Only update if the values are actually different and we're not in the middle of user input.
   */
  useEffect(() => {
    if (value !== inputValue && !isUserTypingRef.current) {
      setInputValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Remove inputValue from dependencies to prevent circular updates

  /**
   * Clear search when network changes.
   * This prevents showing irrelevant search results from previous network.
   * Only clear non-address inputs to preserve valid addresses during network changes.
   */
  useEffect(() => {
    // Only clear search terms, not valid addresses, when chain changes
    if (inputValue.trim() && !isAddress(inputValue.trim())) {
      setInputValue('');
      onChange('');
    }

    // Clear stored token data when network changes to ensure fresh metadata.
    setStoredTokenData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]); // Remove inputValue and onChange from dependencies to prevent clearing during typing

  /**
   * Close dropdown when clicking outside.
   * Uses ref to detect clicks outside the combobox container.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboBoxRef.current && !comboBoxRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle manual input changes.
   * Also handles automatic custom token saving for valid addresses.
   */
  const handleInputChange = useCallback((newValue: string) => {
    // Mark that we're in the middle of user input to prevent circular updates.
    isUserTypingRef.current = true;

    setInputValue(newValue);
    onChange(newValue);

    // Clear stored token data when address changes to ensure fresh metadata.
    if (storedTokenData && storedTokenData.address.toLowerCase() !== newValue.toLowerCase()) {
      setStoredTokenData(null);
    }

    // Reset the typing flag after a short delay to allow for external prop updates.
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 100);

    // If user enters a valid address that's not in our lists, save it as custom token.
    // Note: This will only work if we can fetch the token symbol successfully.
    // The actual saving happens in the parent component after symbol detection.
  }, [onChange, storedTokenData]);

  /**
   * Handle token selection from dropdown.
   * Updates both input value and calls onChange callback.
   * Also stores token metadata for later use.
   */
  const handleTokenSelect = useCallback((token: TokenMetadata) => {
    const newValue = token.address;

    // Mark that this is not user typing to prevent interference.
    isUserTypingRef.current = false;

    setInputValue(newValue);
    onChange(newValue);
    setIsDropdownOpen(false);

    // Store token metadata from dropdown selection.
    setStoredTokenData({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      chainId: token.chainId,
      logoUrl: token.logoUrl,
      trustWalletLogoUrl: token.trustWalletLogoUrl,
    });
  }, [onChange]);

  /**
   * Get custom tokens for the current chain.
   * Returns an array of custom tokens stored for the current network.
   */
  const getCustomTokens = useCallback((): TokenMetadata[] => {
    const customTokens = tokenStorage.getCustomTokensForChain(chainId);
    // Ensure all tokens have required chainId for TokenMetadata compatibility.
    return customTokens.map(token => ({
      ...token,
      chainId: token.chainId || chainId,
    })) as TokenMetadata[];
  }, [chainId]);

  /**
   * Check if a token is custom.
   * Compares against the current chain's custom token list.
   */
  const isCustomToken = useCallback((token: TokenMetadata): boolean => {
    const customTokens = getCustomTokens();
    return customTokens.some(ct =>
      ct.address.toLowerCase() === token.address.toLowerCase(),
    );
  }, [getCustomTokens]);

  /**
   * Handle removing a custom token.
   * Removes from storage and optionally calls success callback.
   */
  const handleRemoveCustomToken = useCallback((
    tokenAddress: string,
    onSuccess?: () => void,
  ) => {
    tokenStorage.removeCustomTokenFromChain(tokenAddress, chainId);
    onSuccess?.();
  }, [chainId]);

  /**
   * Get stored token data for the current value.
   * Returns stored metadata if the current value matches a previously selected token.
   */
  const getStoredTokenData = useCallback((): StoredTokenData | null => {
    if (storedTokenData && storedTokenData.address.toLowerCase() === value.toLowerCase()) {
      return storedTokenData;
    }
    return null;
  }, [storedTokenData, value]);

  return {
    inputValue,
    isDropdownOpen,
    comboBoxRef,
    handleInputChange,
    handleTokenSelect,
    setIsDropdownOpen,
    getCustomTokens,
    isCustomToken,
    handleRemoveCustomToken,
    getStoredTokenData,
  };
};

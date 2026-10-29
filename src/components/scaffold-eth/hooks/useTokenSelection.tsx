import type { RefObject } from 'react';
import { isAddress } from 'viem';
import { ListedToken } from '../../../types/tokens';
import { tokenStorage } from '../../../lib/custom-token-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentNetwork } from '../../../hooks/useCurrentNetwork';

interface StoredTokenData {
  address: string;
  symbol?: string;
  name?: string;
  chainId?: number;
  logoUrl?: string;
  trustWalletLogoUrl?: string;
}

interface UseTokenSelectionProps {
  value: string;
  onChange: (value: string) => void;
}

interface UseTokenSelectionReturn {
  inputValue: string;
  isDropdownOpen: boolean;
  comboBoxRef: RefObject<HTMLDivElement>;
  handleInputChange: (newValue: string) => void;
  handleTokenSelect: (token: ListedToken) => void;
  setIsDropdownOpen: (open: boolean) => void;
  getCustomTokens: () => ListedToken[];
  isCustomToken: (token: ListedToken) => boolean;
  handleRemoveCustomToken: (tokenAddress: string, onSuccess?: () => void) => void;
  getStoredTokenData: () => StoredTokenData | null;
}

/**
 * The token selector's text, its dropdown, and the token last picked from the list, kept in step
 * with the form's value and cleared of a search when the network changes.
 */
export const useTokenSelection = ({
  value,
  onChange,
}: UseTokenSelectionProps): UseTokenSelectionReturn => {
  const { chainId } = useCurrentNetwork().network;

  const [inputValue, setInputValue] = useState(value);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const comboBoxRef = useRef<HTMLDivElement>(null);

  // The token last picked from the list, whose name and logos the selected token's details show.
  const [storedTokenData, setStoredTokenData] = useState<StoredTokenData | null>(null);

  // Set while the user types, so that the form's value echoing back doesn't overwrite the text.
  const isUserTypingRef = useRef(false);

  // Follows the form's value when something else changes it.
  useEffect(() => {
    if (value !== inputValue && !isUserTypingRef.current) {
      setInputValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Not on `inputValue`, which would reset the text whenever it differs.

  // A search from the last network is cleared, but an address is kept.
  useEffect(() => {
    if (inputValue.trim() && !isAddress(inputValue.trim())) {
      setInputValue('');
      onChange('');
    }

    setStoredTokenData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]); // Only on a change of network, not on each keystroke.

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboBoxRef.current && !comboBoxRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((newValue: string) => {
    isUserTypingRef.current = true;

    setInputValue(newValue);
    onChange(newValue);

    if (storedTokenData && storedTokenData.address.toLowerCase() !== newValue.toLowerCase()) {
      setStoredTokenData(null);
    }

    // Long enough for the form's value to come back through `value`.
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 100);
  }, [onChange, storedTokenData]);

  const handleTokenSelect = useCallback((token: ListedToken) => {
    const newValue = token.address;

    isUserTypingRef.current = false;

    setInputValue(newValue);
    onChange(newValue);
    setIsDropdownOpen(false);

    setStoredTokenData({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      chainId: token.chainId,
      logoUrl: token.logoUrl,
      trustWalletLogoUrl: token.trustWalletLogoUrl,
    });
  }, [onChange]);

  const getCustomTokens = useCallback((): ListedToken[] => {
    const customTokens = tokenStorage.getCustomTokensForChain(chainId);
    return customTokens.map(token => ({
      ...token,
      chainId: token.chainId || chainId,
    })) as ListedToken[];
  }, [chainId]);

  const isCustomToken = useCallback((token: ListedToken): boolean => {
    const customTokens = getCustomTokens();
    return customTokens.some(ct =>
      ct.address.toLowerCase() === token.address.toLowerCase(),
    );
  }, [getCustomTokens]);

  const handleRemoveCustomToken = useCallback((
    tokenAddress: string,
    onSuccess?: () => void,
  ) => {
    tokenStorage.removeCustomTokenFromChain(tokenAddress, chainId);
    onSuccess?.();
  }, [chainId]);

  /**
   * The details of the token last picked from the list, if it's still the selected one.
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

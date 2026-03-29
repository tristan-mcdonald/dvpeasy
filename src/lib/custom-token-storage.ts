/**
 * Custom token storage utilities for the TokenSelect component.
 * Handles user-defined tokens stored in localStorage with network-aware management.
 */
import { TokenMetadata } from './token-api';
import { logger } from './logger';

/**
 * localStorage utilities for managing custom tokens.
 */
const CUSTOM_TOKENS_KEY = 'dvp-custom-tokens';

export interface CustomTokensStorage {
  chainTokens: Record<number, TokenMetadata[]>;
  lastUpdated: number;
}

export const tokenStorage = {
  /**
   * Initialize or load storage.
   */
  _getStorage (): CustomTokensStorage {
    try {
      const stored = localStorage.getItem(CUSTOM_TOKENS_KEY);
      if (!stored) {
        const newStorage: CustomTokensStorage = {
          chainTokens: {},
          lastUpdated: Date.now(),
        };
        localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(newStorage));
        return newStorage;
      }
      return JSON.parse(stored);
    } catch (error) {
      logger.warn('Failed to load storage, using empty storage:', error);
      const emptyStorage: CustomTokensStorage = {
        chainTokens: {},
        lastUpdated: Date.now(),
      };
      localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(emptyStorage));
      return emptyStorage;
    }
  },


  /**
   * Save custom tokens for a specific chain.
   */
_saveCustomTokensForChain (chainId: number, tokens: TokenMetadata[]): void {
    try {
      const data = this._getStorage();
      data.chainTokens[chainId] = tokens;
      data.lastUpdated = Date.now();
      localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(data));
    } catch (error) {
      logger.warn('Failed to save custom tokens for chain:', error);
    }
  },

/**
   * Load custom tokens for a specific chain.
   */
  getCustomTokensForChain (chainId: number): TokenMetadata[] {
    try {
      const data = this._getStorage();
      return data.chainTokens[chainId] || [];
    } catch (error) {
      logger.warn('Failed to load custom tokens for chain:', error);
      return [];
    }
  },


  /**
   * Add a new custom token for a specific chain.
   */
  addCustomTokenForChain (token: TokenMetadata, chainId: number): TokenMetadata[] {
    const existing = this.getCustomTokensForChain(chainId);

    // Ensure token has chainId set.
    const tokenWithChainId = { ...token, chainId };

    // Check if token already exists (by address and chainId).
    const exists = existing.some(existingToken =>
      existingToken.address.toLowerCase() === tokenWithChainId.address.toLowerCase() &&
      existingToken.chainId === chainId,
    );

    if (!exists) {
      const updated = [...existing, tokenWithChainId];
      this._saveCustomTokensForChain(chainId, updated);
      return updated;
    }

    return existing;
  },


  /**
   * Search custom tokens by symbol, name, or address for a specific chain.
   */
  searchCustomTokens (query: string, chainId: number): TokenMetadata[] {
    const customTokens = this.getCustomTokensForChain(chainId);
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
      return customTokens;
    }

    return customTokens.filter(token =>
      token.symbol.toLowerCase().includes(searchTerm) ||
      token.name.toLowerCase().includes(searchTerm) ||
      token.address.toLowerCase().includes(searchTerm),
    );
  },

  /**
   * Remove a custom token by address from a specific chain.
   */
  removeCustomTokenFromChain (address: string, chainId: number): TokenMetadata[] {
    const existing = this.getCustomTokensForChain(chainId);
    const updated = existing.filter(token =>
      token.address.toLowerCase() !== address.toLowerCase(),
    );
    this._saveCustomTokensForChain(chainId, updated);
    return updated;
  },

  /**
   * Clear all custom tokens for a specific chain.
   */
  clearCustomTokensForChain (chainId: number): void {
    this._saveCustomTokensForChain(chainId, []);
  },

  /**
   * Get storage statistics for debugging and monitoring.
   */
getStorageStats (): {
    totalCustomTokens: number;
    chainBreakdown: Record<number, number>;
  } {
    try {
      const data = this._getStorage();
      const chainBreakdown: Record<number, number> = {};

      // Count tokens per chain.
      Object.entries(data.chainTokens).forEach(([chainId, tokens]) => {
        chainBreakdown[Number(chainId)] = tokens.length;
      });

const totalCustomTokens = Object.values(chainBreakdown).reduce((sum, count) => sum + count, 0);

      return {
        totalCustomTokens,
        chainBreakdown,
      };
    } catch (error) {
      logger.warn('Failed to get storage stats:', error);
return {
        totalCustomTokens: 0,
        chainBreakdown: {},
      };
    }
  },
};

import { ListedToken } from '../types/tokens';
import { logger } from './logger';

const CUSTOM_TOKENS_KEY = 'dvp-custom-tokens';

export interface CustomTokensStorage {
  chainTokens: Record<number, ListedToken[]>;
  lastUpdated: number;
}

/**
 * Tokens the user has added in the token selector, kept in `localStorage` by chain ID.
 */
export const tokenStorage = {
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


_saveCustomTokensForChain (chainId: number, tokens: ListedToken[]): void {
    try {
      const data = this._getStorage();
      data.chainTokens[chainId] = tokens;
      data.lastUpdated = Date.now();
      localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(data));
    } catch (error) {
      logger.warn('Failed to save custom tokens for chain:', error);
    }
  },

  getCustomTokensForChain (chainId: number): ListedToken[] {
    try {
      const data = this._getStorage();
      return data.chainTokens[chainId] || [];
    } catch (error) {
      logger.warn('Failed to load custom tokens for chain:', error);
      return [];
    }
  },


  addCustomTokenForChain (token: ListedToken, chainId: number): ListedToken[] {
    const existing = this.getCustomTokensForChain(chainId);

    const tokenWithChainId = { ...token, chainId };

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


  searchCustomTokens (query: string, chainId: number): ListedToken[] {
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

  removeCustomTokenFromChain (address: string, chainId: number): ListedToken[] {
    const existing = this.getCustomTokensForChain(chainId);
    const updated = existing.filter(token =>
      token.address.toLowerCase() !== address.toLowerCase(),
    );
    this._saveCustomTokensForChain(chainId, updated);
    return updated;
  },

  clearCustomTokensForChain (chainId: number): void {
    this._saveCustomTokensForChain(chainId, []);
  },

getStorageStats (): {
    totalCustomTokens: number;
    chainBreakdown: Record<number, number>;
  } {
    try {
      const data = this._getStorage();
      const chainBreakdown: Record<number, number> = {};

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

import { Flow } from '../types/settlement';
import { logger } from './logger';

interface FormattedFlow {
  token: string;
  isNFT: boolean;
  from: string;
  to: string;
  amountOrId: bigint;
  formattedAmount: string;
}

/**
 * Flows manager for flow-related operations.
 * Provides methods for amount conversion, collection previews, and clipboard operations.
 */
export const flowsManager = {
  /**
   * Safely converts a string amount to BigInt.
   */
  safeAmountToBigInt (amount: string | undefined): bigint {
    try {
      const value = amount || '0';
      // Check if the value is a valid number string before converting to BigInt.
      if (!/^\d+$/.test(value.trim())) {
        return BigInt(0);
      }
      return BigInt(value);
    } catch (error) {
      logger.warn('Invalid amount for BigInt conversion:', { amount, error });
      return BigInt(0);
    }
  },

  /**
   * Creates a mapping of collection addresses to first NFT ID for preview purposes.
   */
  getCollectionPreviews (flows: (FormattedFlow | Flow)[]): Record<string, string> {
    const collectionPreviews: Record<string, string> = {};

    // Filter to only NFT flows.
    const nftFlows = flows.filter(flow => flow.isNFT);

    // Group by token address and pick first NFT ID.
    nftFlows.forEach(flow => {
      const collectionAddress = flow.token.toLowerCase();

      // Only set if we haven't seen this collection yet.
      if (!collectionPreviews[collectionAddress]) {
        const tokenId = 'amountOrId' in flow ? flow.amountOrId.toString() : flow.amount;
        collectionPreviews[collectionAddress] = tokenId;
      }
    });

    return collectionPreviews;
  },

  /**
   * Copies text to clipboard and returns success status.
   */
  async copyToClipboard (text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
      return false;
    }
  },
};

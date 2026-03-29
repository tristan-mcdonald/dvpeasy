import { logger } from './logger';
import { TokenDetectionError } from '../lib/token-manager';

/**
 * Common error messages for settlement creation operations.
 */
export const SETTLEMENT_ERROR_MESSAGES: Record<string, string> = {
  'CallerNotInvolved': 'You must be a participant in the settlement.',
  'CutoffDatePassed': 'The cutoff date has already passed. Please choose a future date.',
  'execution reverted': 'Transaction failed. Please check your inputs and try again.',
  'gas required exceeds allowance': 'Transaction would exceed gas limit. Please try with fewer flows.',
  'insufficient funds': 'Insufficient ETH to pay for gas.',
  'InsufficientAllowance': 'One or more tokens need to be approved for transfer.',
  'InsufficientBalance': 'One or more parties have insufficient token balance.',
  'InvalidNFTApproval': 'NFT approval is required for one or more tokens.',
  'network disconnected': 'Network connection lost. Please check your internet connection and try again.',
  'NoFlowsProvided': 'Please add at least one flow to the settlement.',
  'User rejected the request': 'Transaction was cancelled.',
  'user rejected transaction': 'Transaction was cancelled.',
};

/**
 * Settlement error manager for handling settlement-specific error operations.
 * Provides methods for parsing and formatting settlement creation errors.
 */
export const settlementErrorManager = {
  /**
   * Get user-friendly error message from settlement creation errors.
   */
  async getSettlementErrorMessage (error: unknown): Promise<string> {
    if (error instanceof TokenDetectionError) {
      return `Invalid token at ${error.tokenAddress}: ${error.message}`;
    }

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      for (const [errorCode, message] of Object.entries(SETTLEMENT_ERROR_MESSAGES)) {
        if (errorMessage.includes(errorCode.toLowerCase())) {
          return message;
        }
      }

      logger.error('Failed to create settlement. Please check your inputs and try again.', error);
      return 'Failed to create settlement. Please check your inputs and try again.';
    }

    logger.error('Failed to create settlement. Please try again.', error);
    return 'Failed to create settlement. Please try again.';
  },
};

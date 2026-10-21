import {
  ContractError,
  ContractErrorType,
  ContractNotFoundError,
  ContractReadError,
  InsufficientBalanceError,
  InvalidDataError,
  NetworkError,
  RateLimitError,
  SettlementNotFoundError,
  TokenDetectionError,
  TransactionError,
  UserRejectionError,
} from '../types/errors';
import { logger } from './logger';

/**
 * Error management system for contract-related errors.
 * Provides methods for parsing, formatting, and handling various error types.
 */
export const errorManager = {
  /**
   * Parse and categorize contract errors based on error messages and types.
   */
  parse (error: unknown, context?: Record<string, unknown>): ContractErrorType {
    // If it's already a ContractError, return it as the correct type.
    if (error instanceof ContractError) {
      return error as ContractErrorType;
    }

    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const errorName = error instanceof Error ? error.name : '';

    // Network-related errors.
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504') ||
      errorName === 'NetworkError'
    ) {
      return new NetworkError(errorMessage, error);
    }

    // Rate limiting errors.
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('429') ||
      errorMessage.includes('quota')
    ) {
      return new RateLimitError(errorMessage, error);
    }

    // User rejection errors.
    if (
      errorMessage.includes('user rejected') ||
      errorMessage.includes('user denied') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('rejected by user') ||
      errorName === 'UserRejectedRequestError'
    ) {
      return new UserRejectionError(errorMessage, error);
    }

    // Contract not found errors.
    if (
      errorMessage.includes('contract not found') ||
      errorMessage.includes('no contract code') ||
      errorMessage.includes('contract does not exist') ||
      errorMessage.includes('invalid address')
    ) {
      return new ContractNotFoundError(errorMessage, error);
    }

    // Settlement not found errors.
    if (
      errorMessage.includes('settlement not found') ||
      errorMessage.includes('settlement does not exist') ||
      (errorMessage.includes('revert') && errorMessage.includes('settlement'))
    ) {
      const settlementId = context?.settlementId as string || 'unknown';
      return new SettlementNotFoundError(settlementId, error);
    }

    // Insufficient balance errors.
    if (
      errorMessage.includes('insufficient') ||
      errorMessage.includes('balance') ||
      errorMessage.includes('not enough')
    ) {
      const required = context?.required as string || 'unknown';
      const available = context?.available as string || 'unknown';
      return new InsufficientBalanceError(required, available, error);
    }

    // Token detection errors.
    if (
      errorMessage.includes('token') ||
      errorMessage.includes('erc20') ||
      errorMessage.includes('erc721') ||
      errorMessage.includes('invalid token')
    ) {
      const tokenAddress = context?.tokenAddress as string || 'unknown';
      return new TokenDetectionError(tokenAddress, error);
    }

    // Transaction errors.
    if (
      errorMessage.includes('transaction') ||
      errorMessage.includes('revert') ||
      errorMessage.includes('execution') ||
      errorName === 'TransactionExecutionError'
    ) {
      return new TransactionError(errorMessage, error);
    }

    // Contract read errors.
    if (
      errorMessage.includes('read') ||
      errorMessage.includes('call') ||
      errorMessage.includes('view function')
    ) {
      return new ContractReadError(errorMessage, error);
    }

    // Generic invalid data error as fallback.
    return new InvalidDataError(errorMessage, error);
  },

  /**
   * Format an error for user display.
   */
  formatUserMessage (error: ContractErrorType): string {
    // Handle cases where error might not have toUserMessage method.
    if (error && typeof error.toUserMessage === 'function') {
      return error.toUserMessage();
    }

    // Fallback for regular Error objects.
    if (error instanceof Error) {
      return error.message;
    }

    // Fallback for other types.
    return typeof error === 'string' ? error : 'An unknown error occurred';
  },

  /**
   * Check if an error is retryable.
   */
  isRetryable (error: ContractErrorType): boolean {
    return error.isRetryable;
  },

  /**
   * Calculate retry delay based on error type and retry count.
   */
  retryDelay (error: ContractErrorType, retryCount: number): number {
    const baseDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);

    if (error instanceof RateLimitError) {
      return Math.min(baseDelay * 2, 60000);
    } else if (error instanceof NetworkError) {
      return Math.min(baseDelay, 10000);
    }

    return baseDelay;
  },

  /**
   * Enhanced error details for debugging.
   */
  debugInfo (error: ContractErrorType): Record<string, unknown> {
    return {
      type: error.type,
      message: error.message,
      isRetryable: error.isRetryable,
      userMessage: error.toUserMessage(),
      timestamp: new Date().toISOString(),
      stack: error.stack,
      originalError: error.originalError,
    };
  },

  /**
   * Log an error with context.
   */
  log (error: ContractErrorType, context?: Record<string, unknown>): void {
    const errorInfo = this.debugInfo(error);
    const fullContext = {
      ...errorInfo,
      ...context,
    };

    if (error instanceof UserRejectionError) {
      logger.info('User rejected action', fullContext);
    } else if (error instanceof NetworkError || error instanceof RateLimitError) {
      logger.warn(`${error.type}: ${error.message}`, fullContext);
    } else {
      logger.error(`${error.type}: ${error.message}`, fullContext);
    }
  },
};

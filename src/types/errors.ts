/**
 * Base error type for all contract-related errors.
 */
export abstract class ContractError extends Error {
  abstract readonly type: string;
  abstract readonly userMessage: string;
  abstract readonly isRetryable: boolean;

  constructor (message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Network connectivity or RPC errors.
 */
export class NetworkError extends ContractError {
  readonly type = 'NETWORK_ERROR';
  readonly userMessage = 'Network connection failed. Please check your internet connection and try again.';
  readonly isRetryable = true;
}

/**
 * Contract doesn't exist at the specified address.
 */
export class ContractNotFoundError extends ContractError {
  readonly type = 'CONTRACT_NOT_FOUND';
  readonly userMessage = 'Contract not found. Please verify the contract address.';
  readonly isRetryable = false;
}

/**
 * Invalid or malformed data returned from contract.
 */
export class InvalidDataError extends ContractError {
  readonly type = 'INVALID_DATA';
  readonly userMessage = 'Invalid data received from contract. Please try again.';
  readonly isRetryable = true;
}

/**
 * Settlement-specific errors.
 */
export class SettlementNotFoundError extends ContractError {
  readonly type = 'SETTLEMENT_NOT_FOUND';
  readonly userMessage = 'Settlement not found. It may not exist or may have been removed.';
  readonly isRetryable = false;

  constructor (settlementId: string, originalError?: unknown) {
    super(`Settlement with ID ${settlementId} not found`, originalError);
  }
}

/**
 * Insufficient balance for operations.
 */
export class InsufficientBalanceError extends ContractError {
  readonly type = 'INSUFFICIENT_BALANCE';
  readonly userMessage = 'Insufficient balance for this operation.';
  readonly isRetryable = false;

  constructor (required: string, available: string, originalError?: unknown) {
    super(`Insufficient balance: required ${required}, available ${available}`, originalError);
  }
}

/**
 * Token detection and metadata errors.
 */
export class TokenDetectionError extends ContractError {
  readonly type = 'TOKEN_DETECTION_ERROR';
  readonly userMessage = 'Unable to detect token type. Please verify the token address.';
  readonly isRetryable = true;

  constructor (message: string, public readonly tokenAddress: string, originalError?: unknown) {
    super(message, originalError);
  }
}

/**
 * Rate limiting or quota exceeded errors.
 */
export class RateLimitError extends ContractError {
  readonly type = 'RATE_LIMIT_ERROR';
  readonly userMessage = 'Too many requests. Please wait a moment and try again.';
  readonly isRetryable = true;
}

/**
 * Generic contract read error for uncategorized failures.
 */
export class ContractReadError extends ContractError {
  readonly type = 'CONTRACT_READ_ERROR';
  readonly userMessage = 'Failed to read from contract. Please try again.';
  readonly isRetryable = true;
}

/**
 * Transaction-related errors.
 */
export class TransactionError extends ContractError {
  readonly type = 'TRANSACTION_ERROR';
  readonly userMessage = 'Transaction failed. Please try again.';
  readonly isRetryable = true;
}

/**
 * User rejection of transaction.
 */
export class UserRejectionError extends ContractError {
  readonly type = 'USER_REJECTION';
  readonly userMessage = 'Transaction was cancelled.';
  readonly isRetryable = false;
}

/**
 * Union type of all possible contract errors.
 */
export type ContractErrorType =
  | NetworkError
  | ContractNotFoundError
  | InvalidDataError
  | SettlementNotFoundError
  | InsufficientBalanceError
  | TokenDetectionError
  | RateLimitError
  | ContractReadError
  | TransactionError
  | UserRejectionError;

/**
 * Error result type for hooks.
 */
export interface ErrorResult {
  error: ContractErrorType;
  timestamp: number;
  context?: Record<string, unknown>;
}

/**
 * Hook error state.
 */
export interface HookErrorState {
  error: ContractErrorType | null;
  hasError: boolean;
  errorHistory: ErrorResult[];
  clearError: () => void;
  retryCount: number;
  lastRetryAt: number | null;
}

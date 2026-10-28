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
 * Token detection and metadata errors.
 */
export class TokenDetectionError extends ContractError {
  readonly type = 'TOKEN_DETECTION_ERROR';
  readonly userMessage: string;
  readonly isRetryable: boolean = true;

  constructor (message: string, public readonly tokenAddress: string, originalError?: unknown) {
    super(message, originalError);
    this.userMessage = `Invalid token at ${tokenAddress}: ${message}`;
  }
}

/**
 * A token which the DVP contract says is neither an ERC-20 nor an ERC-721, which reading again
 * won't change.
 */
export class UnsupportedTokenError extends TokenDetectionError {
  readonly isRetryable = false;

  constructor (tokenAddress: string) {
    super('Token address does not implement a supported interface (ERC20 or ERC721)', tokenAddress);
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
 * Input which failed validation before it was sent to the contract, with a message for the user.
 */
export class ContractValidationError extends ContractError {
  readonly type = 'VALIDATION_ERROR';
  readonly userMessage: string;
  readonly isRetryable = false;

  constructor (message: string, public readonly data: unknown, public readonly schema: string) {
    super(message);
    this.userMessage = message;
  }
}

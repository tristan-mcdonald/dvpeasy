/**
 * An error from the wallet, the RPC or the DVP contract, with a message for the user and whether
 * trying again might work.
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
 * A request to the RPC which failed or timed out.
 */
export class NetworkError extends ContractError {
  readonly type = 'NETWORK_ERROR';
  readonly userMessage = 'Network connection failed. Please check your internet connection and try again.';
  readonly isRetryable = true;
}

/**
 * An error `errorManager.parse` couldn't name.
 */
export class InvalidDataError extends ContractError {
  readonly type = 'INVALID_DATA';
  readonly userMessage = 'Invalid data received from contract. Please try again.';
  readonly isRetryable = true;
}

/**
 * A settlement ID with no settlement.
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
 * A token whose type or details couldn't be read.
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
 * The RPC refused a request for going over its rate limit.
 */
export class RateLimitError extends ContractError {
  readonly type = 'RATE_LIMIT_ERROR';
  readonly userMessage = 'Too many requests. Please wait a moment and try again.';
  readonly isRetryable = true;
}

/**
 * A contract call which reverted.
 */
export class TransactionError extends ContractError {
  readonly type = 'TRANSACTION_ERROR';
  readonly userMessage = 'Transaction failed. Please try again.';
  readonly isRetryable = true;
}

/**
 * The user declined a request in their wallet.
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

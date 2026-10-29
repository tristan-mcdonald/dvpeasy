import {
  BaseError,
  ContractErrorName,
  ContractFunctionRevertedError,
  HttpRequestError,
  LimitExceededRpcError,
  TimeoutError,
  UserRejectedRequestError,
} from 'viem';
import {
  ContractError,
  InvalidDataError,
  NetworkError,
  RateLimitError,
  SettlementNotFoundError,
  TransactionError,
  UserRejectionError,
} from '../types/errors';
import { DvpAbi } from '../config/contracts/abis';
import { logger } from './logger';

/**
 * What to tell the user when the DVP contract reverts with one of its custom errors. Errors which
 * come from the libraries it uses for transfers, or from a reentrant call, are left to viem's
 * summary.
 */
const REVERT_MESSAGES: Partial<Record<ContractErrorName<DvpAbi>, string>> = {
  ApprovalAlreadyGranted: 'This settlement has already been approved from this address.',
  ApprovalNotGranted: 'This settlement hasn\'t been approved from this address.',
  CallerNotInvolved: 'You must be a participant in the settlement.',
  CutoffDateNotPassed: 'The settlement\'s cutoff date hasn\'t passed yet.',
  CutoffDatePassed: 'The settlement\'s cutoff date has passed.',
  IncorrectETHAmount: 'The ETH sent doesn\'t match the amount the settlement needs.',
  InvalidAmountOrId: 'One or more flows has an invalid amount or NFT ID.',
  InvalidERC20Token: 'One or more tokens isn\'t a valid ERC-20 token.',
  InvalidERC721Token: 'One or more tokens isn\'t a valid ERC-721 token.',
  InvalidFromAddress: 'One or more flows has an invalid sender.',
  InvalidToAddress: 'One or more flows has an invalid receiver.',
  NoETHToWithdraw: 'There is no ETH to withdraw.',
  NoFlowsProvided: 'Please add at least one flow to the settlement.',
  SafeERC20FailedOperation: 'A token transfer failed.',
  SettlementAlreadyExecuted: 'This settlement has already been executed.',
  SettlementDoesNotExist: 'Settlement not found. It may not exist or may have been removed.',
  SettlementNotApproved: 'Not every party has approved this settlement yet.',
};

/**
 * The first error of the given class in a viem error's chain of causes.
 */
function findCause<Cause extends Error> (
  error: unknown,
  causeClass: abstract new (...args: never[]) => Cause,
): Cause | undefined {
  if (!(error instanceof BaseError)) return undefined;
  const cause = error.walk(cause => cause instanceof causeClass);
  return cause instanceof causeClass ? cause : undefined;
}

/**
 * Classifying, logging and describing errors from the wallet, the RPC and the DVP contract.
 */
export const errorManager = {
  /**
   * An error's message, or the fallback for a value thrown which isn't an `Error`.
   */
  message (error: unknown, fallback: string = 'Unknown error'): string {
    return error instanceof Error ? error.message : fallback;
  },

  /**
   * Classifies an error by viem's error classes, which wagmi's errors carry as their causes.
   */
  parse (error: unknown, context: Record<string, unknown> = {}): ContractError {
    if (error instanceof ContractError) return error;

    const message = this.message(error, String(error));
    const httpError = findCause(error, HttpRequestError);
    const revertedError = findCause(error, ContractFunctionRevertedError);

    if (findCause(error, UserRejectedRequestError)) return new UserRejectionError(message, error);
    if (findCause(error, LimitExceededRpcError) || httpError?.status === 429) {
      return new RateLimitError(message, error);
    }
    if (httpError || findCause(error, TimeoutError)) return new NetworkError(message, error);
    if (revertedError?.data?.errorName === 'SettlementDoesNotExist') {
      const settlementId = typeof context.settlementId === 'string' ? context.settlementId : 'unknown';
      return new SettlementNotFoundError(settlementId, error);
    }
    if (revertedError) return new TransactionError(message, error);
    return new InvalidDataError(message, error);
  },

  /**
   * The message to show the user for an error. Each kind has its own, except the two which wrap an
   * error `parse` couldn't name, whose cause can say more: the DVP contract's custom error, or the
   * one-line summary from viem or wagmi.
   */
  formatUserMessage (error: ContractError): string {
    const isUnnamed = error instanceof TransactionError || error instanceof InvalidDataError;
    if (!isUnnamed) return error.userMessage;

    const { originalError } = error;
    const revertedErrorName = findCause(originalError, ContractFunctionRevertedError)?.data?.errorName;
    const revertMessage = REVERT_MESSAGES[revertedErrorName as ContractErrorName<DvpAbi>];
    if (revertMessage) return revertMessage;

    if (
      originalError instanceof Error &&
      'shortMessage' in originalError &&
      typeof originalError.shortMessage === 'string'
    ) {
      return originalError.shortMessage;
    }

    return error.userMessage;
  },

  /**
   * Parses and logs an error, and returns the message to show the user.
   */
  report (error: unknown, context: Record<string, unknown> = {}): string {
    const parsedError = this.parse(error, context);
    this.log(parsedError, context);
    return this.formatUserMessage(parsedError);
  },

  /**
   * Details of an error for the log.
   */
  debugInfo (error: ContractError): Record<string, unknown> {
    return {
      type: error.type,
      message: error.message,
      isRetryable: error.isRetryable,
      userMessage: error.userMessage,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      originalError: error.originalError,
    };
  },

  log (error: ContractError, context?: Record<string, unknown>): void {
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

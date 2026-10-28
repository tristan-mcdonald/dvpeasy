import { Address, isAddress } from 'viem';
import { ContractValidationError } from '../types/errors';
import { FlowDraft } from '../types/settlement';
import { z } from 'zod';

/**
 * A flow from the form whose addresses have been checked, with its amount still as typed.
 */
export interface ValidatedFlowDraft extends FlowDraft {
  token: Address;
  from: Address;
  to: Address;
}

/**
 * Type guards and runtime validation for smart contract interactions.
 * This module provides both TypeScript type guards and Zod schemas for runtime validation.
 */

// Base validation schemas for common types.
const AddressSchema = z.string().refine(isAddress, {
  message: 'Invalid Ethereum address format',
});

// Reusable schema for parsing string/number to BigInt.
const BigIntFromStringSchema = z.union([
  z.bigint().refine((val) => val >= 0n, { message: 'Amount/ID must be non-negative' }),
  z.string().transform((val, ctx) => {
    try {
      const bigIntValue = BigInt(val);
      if (bigIntValue < 0n) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Amount/ID must be non-negative',
        });
        return z.NEVER;
      }
      return bigIntValue;
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid numeric format',
      });
      return z.NEVER;
    }
  }),
  z.number().transform((val, ctx) => {
    try {
      const bigIntValue = BigInt(val);
      if (bigIntValue < 0n) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Amount/ID must be non-negative',
        });
        return z.NEVER;
      }
      return bigIntValue;
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid numeric format',
      });
      return z.NEVER;
    }
  }),
]);

// Schema for future date validation.
const FutureDateSchema = z.string()
  .transform((val, ctx) => {
    // Handle both 'Y-m-d H:i' format and ISO format.
    const isoDateString = val.includes('T') ? val : val.replace(' ', 'T') + ':00';
    const date = new Date(isoDateString);

    if (isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid date format. Use YYYY-MM-DD HH:MM format.',
      });
      return z.NEVER;
    }

    if (date.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cutoff date must be in the future',
      });
      return z.NEVER;
    }

    return BigInt(Math.floor(date.getTime() / 1000));
  });

// Flow schema with full validation and transformation.
const FlowInputSchema = z.object({
  token: AddressSchema,
  from: AddressSchema,
  to: AddressSchema,
  amount: z.string().min(1, { message: 'Amount is required' }),
  isNFT: z.boolean(),
});

/**
 * Flow schema that validates amount format without transforming to BigInt.
 * The actual BigInt conversion happens later with proper decimal handling.
 */
const FlowWithAmountValidationSchema = FlowInputSchema.extend({
  amount: z.string().min(1).refine((val) => {
    /**
     * For NFTs, must be a valid integer.
     * For ERC20s, can be decimal or integer.
     * Just validate it's a valid number format.
     */
    const numValue = Number(val);
    return !isNaN(numValue) && numValue >= 0;
  }, {
    message: 'Amount must be a valid non-negative number',
  }),
}).transform((flow) => ({
  token: flow.token as Address,
  from: flow.from as Address,
  to: flow.to as Address,
  amount: flow.amount,
  isNFT: flow.isNFT,
}));

// Settlement schema with full transformation.
const SettlementSubmissionSchema = z.object({
  flows: z.array(FlowInputSchema),
  reference: z.string().max(256),
  cutoffDate: FutureDateSchema,
  isAutoSettled: z.boolean(),
}).transform((input) => ({
  validatedFlows: input.flows.map(flow => ({
    token: flow.token as Address,
    from: flow.from as Address,
    to: flow.to as Address,
    amount: flow.amount,
    isNFT: flow.isNFT,
  })),
  reference: input.reference,
  cutoffTimestamp: input.cutoffDate,
  isAutoSettled: input.isAutoSettled,
}));

/**
 * Contract validation manager for structured validation operations.
 * Provides type guards, validation functions, and error handling for contract data.
 */
export const contractValidationManager = {
  /**
   * Type guard for validating Ethereum addresses.
   */
  isValidAddress (value: unknown): value is Address {
    return typeof value === 'string' && isAddress(value);
  },

  /**
   * Validates and normalizes a settlement ID.
   */
  validateSettlementId (id: unknown): bigint {
    const result = BigIntFromStringSchema.safeParse(id);
    if (result.success) {
      return result.data;
    }
    throw new Error('Settlement ID must be a valid number, string, or BigInt');
  },

  /**
   * Validates and converts an amount or token ID to BigInt.
   * Uses the existing BigIntFromStringSchema for consistent validation.
   */
  validateAmountOrId (value: unknown, isNFT: boolean): bigint {
    const result = BigIntFromStringSchema.safeParse(value);
    if (!result.success) {
      throw new ContractValidationError(
        `Invalid ${isNFT ? 'token ID' : 'amount'}: ${result.error.issues[0].message}`,
        value,
        isNFT ? 'tokenId' : 'amount',
      );
    }
    return result.data;
  },

  /**
   * Validation for a single flow before contract submission.
   * Validates all flow fields and returns properly formatted data.
   * Note: Amount remains as string for later parsing with proper decimal handling.
   */
  validateFlowForSubmission (flow: FlowDraft): ValidatedFlowDraft {
    const validationResult = FlowWithAmountValidationSchema.safeParse(flow);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map(issue => {
          const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
          return `${path}${issue.message}`;
        })
        .join(', ');
      throw new ContractValidationError(
        `Flow validation failed: ${errorMessages}`,
        flow,
        'Flow',
      );
    }

    return validationResult.data;
  },

  /**
   * Validation for settlement creation.
   * Validates all settlement fields including flows, dates, and references.
   * Note: Flow amounts remain as strings for later parsing with proper decimal handling.
   */
  validateSettlementForSubmission (input: {
    flows: FlowDraft[];
    reference: string;
    cutoffDate: string;
    isAutoSettled: boolean;
  }): {
    validatedFlows: ValidatedFlowDraft[];
    reference: string;
    cutoffTimestamp: bigint;
    isAutoSettled: boolean;
  } {
    // First validate using the full submission schema.
    const validationResult = SettlementSubmissionSchema.safeParse(input);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map(issue => {
          const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
          return `${path}${issue.message}`;
        })
        .join(', ');
      throw new ContractValidationError(
        `Settlement validation failed: ${errorMessages}`,
        input,
        'Settlement',
      );
    }

    // Now validate each flow.
    const validatedFlows = input.flows.map((flow, index) => {
      try {
        return this.validateFlowForSubmission(flow);
      } catch (error) {
        if (error instanceof ContractValidationError) {
          throw new ContractValidationError(
            `Flow ${index + 1}: ${error.message}`,
            flow,
            `flows[${index}]`,
          );
        }
        throw error;
      }
    });

    return {
      validatedFlows,
      reference: validationResult.data.reference,
      cutoffTimestamp: validationResult.data.cutoffTimestamp,
      isAutoSettled: validationResult.data.isAutoSettled,
    };
  },
};

import { Address, isAddress } from 'viem';
import { logger } from './logger';
import { z } from 'zod';

/**
 * Type guards and runtime validation for smart contract interactions.
 * This module provides both TypeScript type guards and Zod schemas for runtime validation.
 */

// Base validation schemas for common types.
export const AddressSchema = z.string().refine(isAddress, {
  message: 'Invalid Ethereum address format',
});

export const BigIntStringSchema = z.string().refine(
  (value) => {
    try {
      BigInt(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid BigInt string format' },
);

export const PositiveBigIntStringSchema = z.string().refine(
  (value) => {
    try {
      const bigIntValue = BigInt(value);
      return bigIntValue >= 0n;
    } catch {
      return false;
    }
  },
  { message: 'Invalid positive BigInt string format' },
);

// Reusable schema for parsing string/number to BigInt.
export const BigIntFromStringSchema = z.union([
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
export const FutureDateSchema = z.string()
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

// Contract Flow validation schemas.
export const ContractFlowSchema = z.object({
  token: AddressSchema,
  isNFT: z.boolean(),
  from: AddressSchema,
  to: AddressSchema,
  amountOrId: z.bigint(),
});

export const ContractFlowArraySchema = z.array(ContractFlowSchema);

// Settlement response validation schemas.
export const ContractSettlementResultSchema = z.object({
  result: z.tuple([
    z.string(),               // settlementReference
    z.bigint(),               // cutoffDate
    ContractFlowArraySchema,  // flows
    z.boolean(),              // isSettled
    z.boolean(),              // isAutoSettled
  ]),
});

// Token status validation schemas.
export const TokenStatusSchema = z.object({
  tokenAddress: AddressSchema,
  isNFT: z.boolean(),
  amountOrIdRequired: z.bigint(),
  amountOrIdApprovedForDvp: z.bigint(),
  amountOrIdHeldByParty: z.bigint(),
});

export const TokenStatusArraySchema = z.array(TokenStatusSchema);

// Party status validation schemas.
export const PartyStatusSchema = z.object({
  isApproved: z.boolean(),
  etherRequired: z.bigint(),
  etherDeposited: z.bigint(),
  tokenStatuses: TokenStatusArraySchema,
});

// Flow schema with full validation and transformation.
export const FlowInputSchema = z.object({
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
export const FlowWithAmountValidationSchema = FlowInputSchema.extend({
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

// Settlement creation input validation.
export const CreateSettlementInputSchema = z.object({
  flows: z.array(FlowInputSchema),
  reference: z.string().max(256),
  cutoffDate: z.string(),
  isAutoSettled: z.boolean(),
});

// Settlement schema with full transformation.
export const SettlementSubmissionSchema = z.object({
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
   * Type guard for validating contract settlement result structure.
   */
  isValidContractSettlementResult (data: unknown): data is z.infer<typeof ContractSettlementResultSchema> {
    try {
      ContractSettlementResultSchema.parse(data);
      return true;
    } catch (error) {
      logger.warn('Invalid contract settlement result:', error);
      return false;
    }
  },

  /**
   * Type guard for validating contract flow structure.
   */
  isValidContractFlow (data: unknown): data is z.infer<typeof ContractFlowSchema> {
    try {
      ContractFlowSchema.parse(data);
      return true;
    } catch (error) {
      logger.warn('Invalid contract flow:', error);
      return false;
    }
  },

  /**
   * Type guard for validating token status structure.
   */
  isValidTokenStatus (data: unknown): data is z.infer<typeof TokenStatusSchema> {
    try {
      TokenStatusSchema.parse(data);
      return true;
    } catch (error) {
      logger.warn('Invalid token status:', error);
      return false;
    }
  },

  /**
   * Type guard for validating party status structure.
   */
  isValidPartyStatus (data: unknown): data is z.infer<typeof PartyStatusSchema> {
    try {
      PartyStatusSchema.parse(data);
      return true;
    } catch (error) {
      logger.warn('Invalid party status:', error);
      return false;
    }
  },

  /**
   * Type guard for validating Ethereum addresses.
   */
  isValidAddress (value: unknown): value is Address {
    return typeof value === 'string' && isAddress(value);
  },

  /**
   * Type guard for validating settlement creation input.
   */
  isValidSettlementCreationInput (data: unknown): data is z.infer<typeof CreateSettlementInputSchema> {
    try {
      CreateSettlementInputSchema.parse(data);
      return true;
    } catch (error) {
      logger.warn('Invalid settlement creation input:', error);
      return false;
    }
  },

  /**
   * Safe validation function that throws ContractValidationError on failure.
   */
  validateOrThrow<T> (
    schema: z.ZodSchema<T>,
    data: unknown,
    schemaName: string,
  ): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = `Validation failed for ${schemaName}: ${error.issues.map(i => i.message).join(', ')}`;
        throw new ContractValidationError(message, data, schemaName);
      }
      throw error;
    }
  },

  /**
   * Safe validation function that returns a result object.
   */
  validateSafely<T> (
    schema: z.ZodSchema<T>,
    data: unknown,
  ): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);
    return result.success
      ? { success: true, data: result.data }
      : { success: false, error: result.error };
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
  validateFlowForSubmission (flow: {
    token: string;
    from: string;
    to: string;
    amount: string;
    isNFT: boolean;
  }): {
    token: Address;
    from: Address;
    to: Address;
    amount: string;
    isNFT: boolean;
  } {
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
    flows: Array<{
      token: string;
      from: string;
      to: string;
      amount: string;
      isNFT: boolean;
    }>;
    reference: string;
    cutoffDate: string;
    isAutoSettled: boolean;
  }): {
    validatedFlows: Array<{
      token: Address;
      from: Address;
      to: Address;
      amount: string;
      isNFT: boolean;
    }>;
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

// Validation error types.
export class ContractValidationError extends Error {
  constructor (
    message: string,
    public readonly data: unknown,
    public readonly schema: string,
  ) {
    super(message);
    this.name = 'ContractValidationError';
  }
}

// Export type definitions for use in other modules.
export type ContractFlow = z.infer<typeof ContractFlowSchema>;
export type ContractSettlementResult = z.infer<typeof ContractSettlementResultSchema>;
export type TokenStatus = z.infer<typeof TokenStatusSchema>;
export type PartyStatus = z.infer<typeof PartyStatusSchema>;
export type CreateSettlementInput = z.infer<typeof CreateSettlementInputSchema>;

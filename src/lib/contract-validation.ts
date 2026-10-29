import { Address, isAddress } from 'viem';
import { ContractValidationError } from '../types/errors';
import { FlowDraft } from '../types/settlement';
import { z } from 'zod';

const AddressSchema = z.custom<Address>(value => typeof value === 'string' && isAddress(value), {
  message: 'Invalid Ethereum address format',
});

// A non-negative whole number, from a bigint, a string or a number.
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

// A cutoff date from the date picker, which must be in the future, as a timestamp in seconds.
const FutureDateSchema = z.string()
  .transform((val, ctx) => {
    // Accepts the date picker's `Y-m-d H:i`, or ISO.
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

// A flow from the form, with its amount checked as a number but kept as typed, to be parsed with
// its token's decimals.
const FlowSchema = z.object({
  token: AddressSchema,
  from: AddressSchema,
  to: AddressSchema,
  amount: z.string()
    .min(1, { message: 'Amount is required' })
    .refine(amount => !isNaN(Number(amount)) && Number(amount) >= 0, {
      message: 'Amount must be a valid non-negative number',
    }),
});

/**
 * A flow from the form whose addresses have been checked, with its amount still as typed.
 */
export type ValidatedFlowDraft = z.output<typeof FlowSchema>;

const SettlementSubmissionSchema = z.object({
  flows: z.array(FlowSchema),
  reference: z.string().max(256),
  cutoffDate: FutureDateSchema,
  isAutoSettled: z.boolean(),
}).transform(input => ({
  validatedFlows: input.flows,
  reference: input.reference,
  cutoffTimestamp: input.cutoffDate,
  isAutoSettled: input.isAutoSettled,
}));

/**
 * Checking input before it's sent to the DVP contract.
 */
export const contractValidationManager = {
  isValidAddress (value: unknown): value is Address {
    return typeof value === 'string' && isAddress(value);
  },

  validateSettlementId (id: unknown): bigint {
    const result = BigIntFromStringSchema.safeParse(id);
    if (result.success) {
      return result.data;
    }
    throw new Error('Settlement ID must be a valid number, string, or BigInt');
  },

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
   * Checks the create form, throwing one error which lists every problem.
   */
  validateSettlementForSubmission (input: {
    flows: FlowDraft[];
    reference: string;
    cutoffDate: string;
    isAutoSettled: boolean;
  }): z.output<typeof SettlementSubmissionSchema> {
    const validationResult = SettlementSubmissionSchema.safeParse(input);
    if (validationResult.success) return validationResult.data;

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
  },
};

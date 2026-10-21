import { Address } from 'viem';
import type { ContractFlow as ValidatedContractFlow } from '../lib/contract-validation';

// Flow interface with branded types for better type safety.
export interface Flow {
  id?: string;
  token: Address;
  from: Address;
  to: Address;
  amount: string;
  isNFT: boolean;
}

// Contract Flow structure (matches ABI) with typing.
export type ContractFlow = ValidatedContractFlow;

// Settlement interface with better type safety.
export interface Settlement {
  // Unique settlement ID (stringified BigInt).
  id: string;
  // Human-readable reference or title.
  reference: string;
  // Cutoff date as JS timestamp (ms since epoch).
  cutoffDate: number;
  // Whether this settlement has been executed.
  isSettled: boolean;
  // Whether auto-settlement is enabled.
  isAutoSettled: boolean;
  // Optional flows data for enriched settlement information.
  flows?: ContractFlow[];
}

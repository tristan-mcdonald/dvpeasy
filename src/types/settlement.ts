import { Address } from 'viem';
import type {
  ContractFlow as ValidatedContractFlow,
  ContractSettlementResult as ValidatedContractSettlementResult,
} from '../lib/contract-validation';

// Flow interface with branded types for better type safety.
export interface Flow {
  id?: string;
  token: Address;
  from: Address;
  to: Address;
  amount: string;
  isNFT: boolean;
}

// Contract return type for getSettlement function with typing.
export type ContractSettlementResult = ValidatedContractSettlementResult;

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

// Settlement creation data with validation.
export interface SettlementCreationData {
  flows: Flow[];
  reference: string;
  cutoffDate: string; // ISO date string
  isAutoSettled: boolean;
}

// Settlement status enumeration for better type safety.
export enum SettlementStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  EXECUTED = 'executed',
  EXPIRED = 'expired',
}

// Settlement with status information.
export interface SettlementWithStatus extends Settlement {
  status: SettlementStatus;
  expiresAt: Date;
  createdAt?: Date;
}

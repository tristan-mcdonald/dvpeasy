import { ContractFunctionReturnType } from 'viem';
import { DvpAbi } from '../config/contracts/abis';

export type ContractSettlement = ContractFunctionReturnType<DvpAbi, 'view', 'getSettlement'>;
export type ContractPartyStatus = ContractFunctionReturnType<DvpAbi, 'view', 'getSettlementPartyStatus'>;

/**
 * A flow as the DVP contract holds it: `amountOrId` is the amount in base units, or the NFT's ID.
 */
export type Flow = ContractSettlement[2][number];

export type TokenStatus = ContractPartyStatus[3][number];

export interface Settlement {
  id: string;
  reference: string;
  /** In milliseconds since the epoch. */
  cutoffDate: number;
  flows: Flow[];
  isSettled: boolean;
  isAutoSettled: boolean;
}

export interface PartyStatus {
  isApproved: boolean;
  etherRequired: bigint;
  etherDeposited: bigint;
  tokenStatuses: TokenStatus[];
}

/**
 * A flow as it's typed into the settlement form: `amount` is in whole tokens, or the NFT's ID.
 */
export interface FlowDraft {
  token: string;
  from: string;
  to: string;
  amount: string;
  isNFT: boolean;
}

/**
 * A flow as the flow cards and the graph show it: `amount` is formatted with the token's symbol,
 * or as typed into the form.
 */
export interface FlowForDisplay {
  token: string;
  from: string;
  to: string;
  isNFT: boolean;
  amount: string;
  nftId?: string;
}

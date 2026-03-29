import { ContractErrorType } from './errors';

export interface TokenStatus {
  tokenAddress: string
  isNFT: boolean
  amountOrIdRequired: bigint
  amountOrIdApprovedForDvp: bigint
  amountOrIdHeldByParty: bigint
}

export interface PartyStatus {
  isApproved: boolean
  etherRequired: bigint
  etherDeposited: bigint
  tokenStatuses: TokenStatus[]
}

export interface Flow {
  token: string
  isNFT: boolean
  from: string
  to: string
  amountOrId: bigint
}

export interface Settlement {
  settlementReference: string
  cutoffDate: bigint
  flows: Flow[]
  isSettled: boolean
  isAutoSettled: boolean
}

export interface FormattedFlow extends Flow {
  formattedAmount: string
}

export interface SettlementDataState {
  settlement: Settlement | null
  formattedFlows: FormattedFlow[]
  isLoading: boolean
  error: ContractErrorType | null
}

export interface PartyStatusState {
  partyStatus: PartyStatus | null
  isLoading: boolean
  error: ContractErrorType | null
}

export interface ApprovalStatusState {
  allPartiesApproved: boolean
  allApprovalsComplete: boolean
  isLoading: boolean
  error: ContractErrorType | null
}

export interface ValidationState {
  isParticipant: boolean
  networkError: ContractErrorType | null
}

export interface PollingState {
  isRefreshing: boolean
  isManualRefreshing: boolean
}

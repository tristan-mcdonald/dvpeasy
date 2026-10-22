
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

export interface ValidationState {
  isParticipant: boolean
}

export interface PollingState {
  isRefreshing: boolean
  isManualRefreshing: boolean
}

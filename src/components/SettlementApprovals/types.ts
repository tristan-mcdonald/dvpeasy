import { ContractErrorType } from '../../types/errors';
import { ApprovalEvent } from '../../lib/approval-events';

export interface FormattedTokenStatus {
  tokenAddress: string;
  isNFT: boolean;
  amountOrIdRequired: bigint;
  amountOrIdApprovedForDvp: bigint;
  amountOrIdHeldByParty: bigint;
  formattedRequired: string;
  formattedApproved: string;
  formattedHeld: string;
  symbol: string;
  isMaxApproval: boolean;
}

export interface PartyApprovalStatus {
  address: string;
  isLoading: boolean;
  isApproved: boolean;
  etherRequired: bigint;
  etherDeposited: bigint;
  tokenStatuses: FormattedTokenStatus[];
  error?: ContractErrorType;
}

export interface SettlementApprovalsProps {
  partyStatuses: PartyApprovalStatus[];
  isLoading: boolean;
  hasEverLoaded: boolean;
  error: ContractErrorType | null;
  isExpired: boolean;
  isSettled: boolean;
  onApproveToken: (tokenAddress: string, amount: bigint) => void;
  onMaxApprove: (tokenAddress: string) => void;
  currentUserAddress: string | undefined;
  approvingToken: string | null;
  approvalEvents: ApprovalEvent[];
  flows: Array<{ to: string; from: string }>;
  onRevokeApproval?: () => void;
  onWithdrawETH?: () => void;
  isRevoking?: boolean;
  isWithdrawing?: boolean;
}

export type ApprovalStatusType = 'success' | 'error' | 'warning';

export interface ApprovalStatus {
  message: string;
  type: ApprovalStatusType;
  badgeClass: string;
}

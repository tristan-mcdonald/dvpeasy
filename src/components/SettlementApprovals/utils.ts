import { PartyStatusForDisplay } from '../../types/settlement';
import { settlements } from '../../lib/settlements';

export type ApprovalStatusType = 'success' | 'error' | 'warning';

export interface ApprovalStatus {
  message: string;
  type: ApprovalStatusType;
}

/**
 * Settlement manager for approval-related operations.
 */
export const settlementManager = {
  /**
   * Approval status for a party based on current state.
   */
  approvalStatus (
    partyStatus: PartyStatusForDisplay,
    isExpired: boolean,
    isSettled: boolean,
  ): ApprovalStatus {
    // Check if all individual token approvals are complete.
    const allSpendApprovalsComplete = partyStatus.tokenStatuses.every(settlements.isTokenApproved);

    // Check if ether approval is complete.
    const etherApprovalComplete = partyStatus.etherDeposited >= partyStatus.etherRequired;

    // All approvals are complete if party is approved AND all spend approvals are complete.
    const allApprovalsComplete = partyStatus.isApproved && allSpendApprovalsComplete && etherApprovalComplete;

    if (isSettled) return { message: 'All required approvals were completed', type: 'success' };
    if (allApprovalsComplete) return { message: 'All required approvals complete', type: 'success' };
    if (isExpired) return { message: 'Required approvals were not made in time', type: 'error' };
    return { message: 'Awaiting required approvals', type: 'warning' };
  },

  /**
   * Formatted approval amount calculation.
   */
  formattedApprovalAmount (
    formattedRequired: string,
    amountOrIdRequired: bigint,
    amountOrIdApprovedForDvp: bigint,
    symbol: string,
  ): string {
    const requiredAmount = amountOrIdRequired - amountOrIdApprovedForDvp;
    const totalRequired = amountOrIdRequired;
    const requiredPortion = Number(requiredAmount) / Number(totalRequired);
    const formattedRequiredNumeric = parseFloat(formattedRequired.replace(/[^\d.-]/g, ''));
    const formattedRequiredAmount = (formattedRequiredNumeric * requiredPortion).toFixed(6).replace(/\.?0+$/, '');
    return `${formattedRequiredAmount} ${symbol}`;
  },
};

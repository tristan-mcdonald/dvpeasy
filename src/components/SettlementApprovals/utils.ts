import { PartyStatusForDisplay } from '../../types/settlement';
import { settlements } from '../../lib/settlements';

export type ApprovalStatusType = 'success' | 'error' | 'warning';

export interface ApprovalStatus {
  message: string;
  type: ApprovalStatusType;
}

/**
 * What a party's approval card says about its approvals.
 */
export const settlementManager = {
  approvalStatus (
    partyStatus: PartyStatusForDisplay,
    isExpired: boolean,
    isSettled: boolean,
  ): ApprovalStatus {
    const allSpendApprovalsComplete = partyStatus.tokenStatuses.every(settlements.isTokenApproved);

    const etherApprovalComplete = partyStatus.etherDeposited >= partyStatus.etherRequired;

    const allApprovalsComplete = partyStatus.isApproved && allSpendApprovalsComplete && etherApprovalComplete;

    if (isSettled) return { message: 'All required approvals were completed', type: 'success' };
    if (allApprovalsComplete) return { message: 'All required approvals complete', type: 'success' };
    if (isExpired) return { message: 'Required approvals were not made in time', type: 'error' };
    return { message: 'Awaiting required approvals', type: 'warning' };
  },

  /**
   * How much of a token is still to be approved, worked out from the formatted amount required, to
   * six decimal places.
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

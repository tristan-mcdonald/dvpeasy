import { PartyApprovalStatus, ApprovalStatus } from './types';
import { ApprovalEvent } from '../../lib/approval-events';

/**
 * Settlement manager for approval-related operations.
 */
export const settlementManager = {
  /**
   * Badge CSS class for approval status types.
   */
  badgeClass (type: 'success' | 'error' | 'warning'): string {
    const badgeClasses = {
      success: 'badge-success',
      error: 'badge-error',
      warning: 'badge-warning',
    };
    return badgeClasses[type];
  },

  /**
   * Approval status for a party based on current state.
   */
  approvalStatus (
    partyStatus: PartyApprovalStatus,
    isExpired: boolean,
    isSettled: boolean,
  ): ApprovalStatus {
    // Check if all individual token approvals are complete.
    const allSpendApprovalsComplete = partyStatus.tokenStatuses.every(
      tokenStatus => tokenStatus.amountOrIdApprovedForDvp >= tokenStatus.amountOrIdRequired,
    );

    // Check if ether approval is complete.
    const etherApprovalComplete = partyStatus.etherDeposited >= partyStatus.etherRequired;

    // All approvals are complete if party is approved AND all spend approvals are complete.
    const allApprovalsComplete = partyStatus.isApproved && allSpendApprovalsComplete && etherApprovalComplete;

    if (isSettled) {
      return {
        message: 'All required approvals were completed',
        type: 'success',
        badgeClass: this.badgeClass('success'),
      };
    } else if (allApprovalsComplete) {
      return {
        message: 'All required approvals complete',
        type: 'success',
        badgeClass: this.badgeClass('success'),
      };
    } else if (isExpired) {
      return {
        message: 'Required approvals were not made in time',
        type: 'error',
        badgeClass: this.badgeClass('error'),
      };
    } else {
      return {
        message: 'Awaiting required approvals',
        type: 'warning',
        badgeClass: this.badgeClass('warning'),
      };
    }
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

  /**
   * Check if enough tokens are approved.
   */
  hasEnoughApproved (
    amountOrIdApprovedForDvp: bigint,
    amountOrIdRequired: bigint,
  ): boolean {
    return amountOrIdApprovedForDvp >= amountOrIdRequired;
  },

  /**
   * Check if current user is the party.
   */
  isCurrentUserParty (
    currentUserAddress: string | undefined,
    partyAddress: string,
  ): boolean {
    return currentUserAddress?.toLowerCase() === partyAddress.toLowerCase();
  },

  /**
   * Check if approval amount represents max approval.
   */
  isMaxApproval (amount: bigint): boolean {
    // 2^200 - a conservative threshold to detect max approvals (much smaller than 2^256-1)
    const maxApprovalThreshold = BigInt('0x100000000000000000000000000000000000000000000000000000000');
    return amount >= maxApprovalThreshold;
  },

  /**
   * Approval transaction hash for a specific party.
   */
  approvalTransactionForParty (
    partyAddress: string,
    approvalEvents: ApprovalEvent[],
  ): string | undefined {
    const event = approvalEvents.find(
      event => event.party.toLowerCase() === partyAddress.toLowerCase(),
    );
    return event?.transactionHash;
  },

  /**
   * Check if party is involved in settlement flows.
   */
  isPartyInvolved (
    partyAddress: string,
    flows: Array<{ to: string; from: string }>,
  ): boolean {
    return flows.some(
      flow =>
        flow.to.toLowerCase() === partyAddress.toLowerCase() ||
        flow.from.toLowerCase() === partyAddress.toLowerCase(),
    );
  },
};

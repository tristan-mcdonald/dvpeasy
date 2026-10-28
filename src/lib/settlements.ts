import { Address, isAddressEqual } from 'viem';
import { ContractPartyStatus, ContractSettlement, PartyStatus, Settlement, TokenStatus } from '../types/settlement';

/**
 * How often an open settlement's data is read again, in milliseconds.
 */
const POLLING_INTERVAL = 10_000;

/**
 * Rules about a settlement which don't need the chain: its shape, its parties, and whether it can
 * still change.
 */
export const settlements = {
  fromContract (
    id: bigint,
    [reference, cutoffDate, flows, isSettled, isAutoSettled]: ContractSettlement,
  ): Settlement {
    return {
      id: id.toString(),
      reference,
      // The contract holds the cutoff in seconds.
      cutoffDate: Number(cutoffDate) * 1000,
      flows: [...flows],
      isSettled,
      isAutoSettled,
    };
  },

  partyStatusFromContract ([
    isApproved,
    etherRequired,
    etherDeposited,
    tokenStatuses,
  ]: ContractPartyStatus): PartyStatus {
    return { isApproved, etherRequired, etherDeposited, tokenStatuses: [...tokenStatuses] };
  },

  isExpired (settlement: Settlement): boolean {
    return settlement.cutoffDate < Date.now();
  },

  /**
   * A settlement can change until it's executed or its cutoff passes.
   */
  isOpen (settlement: Settlement): boolean {
    return !settlement.isSettled && !this.isExpired(settlement);
  },

  /**
   * Whether the address sends anything in the settlement, and so can approve or execute it.
   */
  isParticipant (settlement: Settlement, address: Address): boolean {
    return settlement.flows.some(flow => isAddressEqual(flow.from, address));
  },

  /**
   * Whether the DVP contract may move at least as much of the token as the party must send.
   */
  isTokenApproved (tokenStatus: TokenStatus): boolean {
    return tokenStatus.amountOrIdApprovedForDvp >= tokenStatus.amountOrIdRequired;
  },

  /**
   * Every address which sends or receives in the settlement, once each, in lower case.
   */
  parties (settlement: Settlement): Address[] {
    const parties = settlement.flows.flatMap(flow => [flow.from, flow.to]);
    return [...new Set(parties.map(party => party.toLowerCase() as Address))];
  },

  /**
   * The `refetchInterval` for a settlement's reads: they poll only while it's open. React Query
   * asks again after every read, so polling stops by itself once the cutoff passes.
   */
  pollingInterval (settlement: Settlement | undefined): number | false {
    return settlement && this.isOpen(settlement) ? POLLING_INTERVAL : false;
  },
};

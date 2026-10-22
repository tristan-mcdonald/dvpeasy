import { Address } from 'viem';
import { Flow, Settlement } from '../types/settlement-details';

type ContractSettlement = readonly [
  settlementReference: string,
  cutoffDate: bigint,
  flows: readonly Flow[],
  isSettled: boolean,
  isAutoSettled: boolean,
];

/**
 * How often an open settlement's data is read again, in milliseconds.
 */
const POLLING_INTERVAL = 10_000;

/**
 * Rules about a settlement which don't need the chain: its shape, its parties, and whether it can
 * still change.
 */
export const settlements = {
  fromContract ([
    settlementReference,
    cutoffDate,
    flows,
    isSettled,
    isAutoSettled,
  ]: ContractSettlement): Settlement {
    return {
      settlementReference,
      cutoffDate,
      flows: [...flows],
      isSettled,
      isAutoSettled,
    };
  },

  isExpired (settlement: Settlement): boolean {
    return Number(settlement.cutoffDate) * 1000 < Date.now();
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
  isParticipant (settlement: Settlement, address: string): boolean {
    return settlement.flows.some(flow => flow.from.toLowerCase() === address.toLowerCase());
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

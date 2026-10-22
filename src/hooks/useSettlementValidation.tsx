import { Settlement, ValidationState } from '../types/settlement-details';
import { useCallback, useMemo } from 'react';

/**
 * Whether the connected address is a party to the settlement, and whether its cutoff has passed.
 */
export function useSettlementValidation (
  settlement: Settlement | null,
  address: string | undefined,
) {
  // Check if settlement is expired.
  const isSettlementExpired = useCallback(() => {
    if (!settlement) return false;
    const cutoffDate = new Date(Number(settlement.cutoffDate) * 1000);
    return cutoffDate.getTime() < Date.now();
  }, [settlement]);

  // Check if the connected address is a participant in the settlement.
  const isParticipant = useMemo(() => {
    if (!settlement || !address) return false;
    return settlement.flows.some(flow =>
      flow.from.toLowerCase() === address.toLowerCase(),
    );
  }, [settlement, address]);

  const state: ValidationState = {
    isParticipant,
  };

  return {
    ...state,
    isSettlementExpired,
  };
}

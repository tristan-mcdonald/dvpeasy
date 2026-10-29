import { PartyStatusForDisplay } from '../../../types/settlement';
import { useMemo } from 'react';

/**
 * The parties which send something, and so have something to approve.
 */
export function useFilteredParties (partyStatuses: PartyStatusForDisplay[]) {
  return useMemo(() => {
    return partyStatuses.filter(party =>
      party.tokenStatuses.length > 0 || party.etherRequired > 0n,
    );
  }, [partyStatuses]);
}

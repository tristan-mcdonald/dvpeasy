import { PartyStatusForDisplay } from '../../../types/settlement';
import { useMemo } from 'react';

export function useFilteredParties (partyStatuses: PartyStatusForDisplay[]) {
  return useMemo(() => {
    return partyStatuses.filter(party =>
      party.tokenStatuses.length > 0 || party.etherRequired > 0n,
    );
  }, [partyStatuses]);
}

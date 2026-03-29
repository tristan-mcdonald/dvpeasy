import { PartyApprovalStatus } from '../types';
import { useMemo } from 'react';

export function useFilteredParties (partyStatuses: PartyApprovalStatus[]) {
  return useMemo(() => {
    return partyStatuses.filter(party =>
      party.tokenStatuses.length > 0 || party.etherRequired > 0n,
    );
  }, [partyStatuses]);
}

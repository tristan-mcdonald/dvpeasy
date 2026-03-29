import { PartyApprovalStatus } from '../types';

export function useLoadingState (
  isLoading: boolean,
  hasEverLoaded: boolean,
  partyStatuses: PartyApprovalStatus[],
) {
  const isInitialLoad = !hasEverLoaded;
  const hasPartiesLoading = partyStatuses.some(party => party.isLoading);
  const shouldShowLoadingState = isLoading || (isInitialLoad && hasPartiesLoading);

  return {
    isInitialLoad,
    hasPartiesLoading,
    shouldShowLoadingState,
  };
}

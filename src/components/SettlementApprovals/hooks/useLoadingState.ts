import { PartyStatusForDisplay } from '../../../types/settlement';

export function useLoadingState (
  isLoading: boolean,
  hasEverLoaded: boolean,
  partyStatuses: PartyStatusForDisplay[],
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

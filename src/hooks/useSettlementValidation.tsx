import { Settlement, ValidationState } from '../types/settlement-details';
import { useCallback, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { useContractConfig } from './useContractConfig';

/**
 * Handles network validation and participant checking for settlement interactions.
 *
 * @param settlement - The settlement data object.
 * @param address - The wallet address to check participation for.
 * @returns Object containing validation state, network error, and utility functions.
 */
export function useSettlementValidation (
  settlement: Settlement | null,
  address: string | undefined,
) {
  const { supportedChainIds } = useContractConfig();
  const walletChainId = useChainId();

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

  // Check if wallet is connected to a supported network.
  const networkError = useMemo(() => {
    if (!supportedChainIds.includes(walletChainId)) {
      const supportedNetworks = supportedChainIds.map(id => {
        if (id === 11155111) return 'Ethereum Sepolia';
        if (id === 421614) return 'Arbitrum Sepolia';
        if (id === 137) return 'Polygon';
        return `Chain ${id}`;
      }).join(', ');
      return new Error(`Please switch to a supported network: ${supportedNetworks}`);
    }
    return null;
  }, [supportedChainIds, walletChainId]);

  const state: ValidationState = {
    isParticipant,
    networkError,
  };

  return {
    ...state,
    isSettlementExpired,
    walletChainId,
    supportedChainIds,
  };
}

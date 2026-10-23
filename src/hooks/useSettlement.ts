import { DVP_ABI } from '../config/contracts/abis';
import { errorManager } from '../lib/error-manager';
import { FormattedFlow } from '../types/settlement-details';
import { settlements } from '../lib/settlements';
import { tokenManager } from '../lib/token-manager';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { useTokensMetadata } from './useTokenMetadata';

const invalidIdError = errorManager.parse(new Error('Invalid settlement ID format'));

/**
 * A settlement, and its flows with their amounts formatted, read again while it's open.
 */
export function useSettlement (settlementId: string | undefined) {
  const { deployment, network } = useCurrentNetwork();
  const isValidId = settlementId !== undefined && /^\d+$/.test(settlementId);

  const settlementQuery = useReadContract({
    address: deployment.dvpAddress,
    abi: DVP_ABI,
    functionName: 'getSettlement',
    args: isValidId ? [BigInt(settlementId)] : undefined,
    chainId: network.chainId,
    query: {
      enabled: isValidId,
      select: settlements.fromContract,
      refetchInterval: (query) => settlements.pollingInterval(
        query.state.data && settlements.fromContract(query.state.data),
      ),
    },
  });
  const settlement = settlementQuery.data;

  const tokensMetadata = useTokensMetadata(settlement?.flows.map(flow => flow.token) ?? []);
  const formattedFlows = useMemo(() => {
    if (!settlement || tokensMetadata.isLoading) return [];
    return settlement.flows.map((flow): FormattedFlow => ({
      ...flow,
      formattedAmount: tokenManager.formatAmount(
        flow.amountOrId,
        tokensMetadata.byAddress[flow.token.toLowerCase()].metadata,
      ),
    }));
  }, [settlement, tokensMetadata]);

  // A failed poll keeps the settlement already read, so only a failed first read is an error.
  const error = useMemo(() => {
    if (!isValidId) return invalidIdError;
    if (settlement || !settlementQuery.error) return null;
    return errorManager.parse(settlementQuery.error, { settlementId });
  }, [isValidId, settlement, settlementQuery.error, settlementId]);

  return {
    settlement,
    formattedFlows,
    isLoading: settlementQuery.isLoading || tokensMetadata.isLoading,
    error,
    refetch: settlementQuery.refetch,
  };
}

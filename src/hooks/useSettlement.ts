import { DVP_ABI } from '../config/contracts/abis';
import { errorManager } from '../lib/error-manager';
import { flowDisplay } from '../lib/flow-display';
import { InvalidDataError } from '../types/errors';
import { settlements } from '../lib/settlements';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { useTokensMetadata } from './useTokenMetadata';

const invalidIdError = new InvalidDataError('Invalid settlement ID format');

/**
 * A settlement, and its flows with their amounts formatted for display, read again while it's
 * open.
 */
export function useSettlement (settlementId: string | undefined) {
  const { deployment, network } = useCurrentNetwork();
  const isValidId = settlementId !== undefined && /^\d+$/.test(settlementId);
  const id = isValidId ? BigInt(settlementId) : 0n;

  const settlementQuery = useReadContract({
    address: deployment.dvpAddress,
    abi: DVP_ABI,
    functionName: 'getSettlement',
    args: isValidId ? [id] : undefined,
    chainId: network.chainId,
    query: {
      enabled: isValidId,
      select: result => settlements.fromContract(id, result),
      refetchInterval: (query) => settlements.pollingInterval(
        query.state.data && settlements.fromContract(id, query.state.data),
      ),
    },
  });
  const settlement = settlementQuery.data;

  const tokensMetadata = useTokensMetadata(settlement?.flows.map(flow => flow.token) ?? []);
  const flowsForDisplay = useMemo(() => {
    if (!settlement || tokensMetadata.isLoading) return [];
    return settlement.flows.map(flow => flowDisplay.fromContract(
      flow,
      tokensMetadata.byAddress[flow.token.toLowerCase()].metadata,
    ));
  }, [settlement, tokensMetadata]);

  // A failed poll keeps the settlement already read, so only a failed first read is an error.
  const error = useMemo(() => {
    if (!isValidId) return invalidIdError;
    if (settlement || !settlementQuery.error) return null;
    return errorManager.parse(settlementQuery.error, { settlementId });
  }, [isValidId, settlement, settlementQuery.error, settlementId]);

  return {
    settlement,
    flowsForDisplay,
    isLoading: settlementQuery.isLoading || tokensMetadata.isLoading,
    error,
    refetch: settlementQuery.refetch,
  };
}

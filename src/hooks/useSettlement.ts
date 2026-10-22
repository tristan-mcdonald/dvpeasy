import { DVP_ABI } from '../config/contracts/abis';
import { errorManager } from '../lib/error-manager';
import { FormattedFlow } from '../types/settlement-details';
import { settlements } from '../lib/settlements';
import { tokenManager } from '../lib/token-manager';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';

const invalidIdError = errorManager.parse(new Error('Invalid settlement ID format'));

/**
 * A settlement, and its flows with their amounts formatted, read again while it's open.
 */
export function useSettlement (settlementId: string | undefined) {
  const networkDeployment = useCurrentNetwork();
  const { deployment, network } = networkDeployment;
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

  // A settlement's flows can't change once it's created, so they're formatted once.
  const formattedFlowsQuery = useQuery({
    queryKey: ['formattedFlows', network.chainId, deployment.dvpAddress, settlementId],
    queryFn: () => Promise.all(settlement!.flows.map(async (flow): Promise<FormattedFlow> => ({
      ...flow,
      formattedAmount: await tokenManager.formatTokenAmount(flow.amountOrId, flow.token, networkDeployment),
    }))),
    enabled: settlement !== undefined,
    staleTime: Infinity,
  });

  // A failed poll keeps the settlement already read, so only a failed first read is an error.
  const error = useMemo(() => {
    if (!isValidId) return invalidIdError;
    if (settlement || !settlementQuery.error) return null;
    return errorManager.parse(settlementQuery.error, { settlementId });
  }, [isValidId, settlement, settlementQuery.error, settlementId]);

  return {
    settlement,
    formattedFlows: formattedFlowsQuery.data ?? [],
    isLoading: settlementQuery.isLoading || formattedFlowsQuery.isLoading,
    error,
    refetch: settlementQuery.refetch,
  };
}

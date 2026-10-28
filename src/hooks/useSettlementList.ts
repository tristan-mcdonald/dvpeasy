import { DVP_ABI, DVP_HELPER_ABI } from '../config/contracts/abis';
import { Settlement } from '../types/settlement';
import { settlements } from '../lib/settlements';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useCallback, useMemo } from 'react';
import { useCurrentNetwork } from './useCurrentNetwork';

/**
 * The most settlements the dashboard lists. The helper contract allows pages of up to 200.
 */
const LIST_LENGTH = 100;

interface UseSettlementListOptions {
  isWalletFiltering: boolean;
}

/**
 * The newest settlements, or, when filtering by wallet, the newest which involve the connected
 * wallet, each with its flows.
 */
export function useSettlementList ({ isWalletFiltering }: UseSettlementListOptions) {
  const { address } = useAccount();
  const { deployment, network } = useCurrentNetwork();
  const { dvpAddress, dvpHelperAddress } = deployment;

  const counterQuery = useReadContract({
    address: dvpAddress,
    abi: DVP_ABI,
    functionName: 'settlementIdCounter',
    chainId: network.chainId,
    query: { enabled: !isWalletFiltering },
  });

  const walletSettlementIdsQuery = useReadContract({
    address: dvpHelperAddress,
    abi: DVP_HELPER_ABI,
    functionName: 'getSettlementsByInvolvedParty',
    // A start cursor of 0 starts from the newest settlement.
    args: address && [dvpAddress, address, 0n, BigInt(LIST_LENGTH)],
    chainId: network.chainId,
    query: { enabled: isWalletFiltering && address !== undefined },
  });

  const settlementIdsQuery = isWalletFiltering ? walletSettlementIdsQuery : counterQuery;

  const settlementIds = useMemo(() => {
    if (isWalletFiltering) return walletSettlementIdsQuery.data?.[0] ?? [];

    // Settlement IDs count up from 1, so the newest are the counter and the IDs just below it.
    const counter = Number(counterQuery.data ?? 0n);
    return Array.from(
      { length: Math.min(counter, LIST_LENGTH) },
      (_, index) => BigInt(counter - index),
    );
  }, [isWalletFiltering, walletSettlementIdsQuery.data, counterQuery.data]);

  const settlementsQuery = useReadContracts({
    contracts: settlementIds.map(settlementId => ({
      address: dvpAddress,
      abi: DVP_ABI,
      functionName: 'getSettlement',
      args: [settlementId],
      chainId: network.chainId,
    } as const)),
    query: { enabled: settlementIds.length > 0 },
  });

  const listedSettlements = useMemo(() => {
    // A read which failed has no result, so it's left out rather than failing the whole list.
    return (settlementsQuery.data ?? []).flatMap(({ result }, index): Settlement[] => (
      result ? [settlements.fromContract(settlementIds[index], result)] : []
    ));
  }, [settlementsQuery.data, settlementIds]);

  const { refetch: refetchSettlementIds } = settlementIdsQuery;
  const { refetch: refetchSettlements } = settlementsQuery;
  const refetch = useCallback(() => {
    refetchSettlementIds();
    refetchSettlements();
  }, [refetchSettlementIds, refetchSettlements]);

  return {
    settlements: listedSettlements,
    isLoading: settlementIdsQuery.isLoading || settlementsQuery.isLoading,
    isError: settlementIdsQuery.isError || settlementsQuery.isError,
    refetch,
  };
}

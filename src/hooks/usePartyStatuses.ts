import { Address } from 'viem';
import { DVP_ABI } from '../config/contracts/abis';
import { errorManager } from '../lib/error-manager';
import { FormattedTokenStatus, PartyApprovalStatus } from '../components/SettlementApprovals/types';
import { useQuery } from '@tanstack/react-query';
import { logger } from '../lib/logger';
import { NetworkDeployment } from '../config/contracts/deployments';
import { PartyStatus, Settlement, TokenStatus } from '../types/settlement-details';
import { settlementManager } from '../components/SettlementApprovals/utils';
import { settlements } from '../lib/settlements';
import { tokenManager } from '../lib/token-manager';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useCallback, useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';

interface UsePartyStatusesOptions {
  settlementId: string | undefined;
  settlement: Settlement | undefined;
  address: Address | undefined;
}

/**
 * The approval status of every party to a settlement, read again while it's open, with the
 * connected address's own status and whether every approval the settlement needs is made.
 */
export function usePartyStatuses ({ settlementId, settlement, address }: UsePartyStatusesOptions) {
  const networkDeployment = useCurrentNetwork();
  const { deployment, network } = networkDeployment;
  const parties = useMemo(() => (settlement ? settlements.parties(settlement) : []), [settlement]);
  const query = {
    enabled: settlement !== undefined,
    refetchInterval: () => settlements.pollingInterval(settlement),
  };

  const settlementApprovalQuery = useReadContract({
    address: deployment.dvpAddress,
    abi: DVP_ABI,
    functionName: 'isSettlementApproved',
    args: settlementId ? [BigInt(settlementId)] : undefined,
    chainId: network.chainId,
    query,
  });

  const partyStatusesQuery = useReadContracts({
    contracts: parties.map(party => ({
      address: deployment.dvpAddress,
      abi: DVP_ABI,
      functionName: 'getSettlementPartyStatus',
      args: [BigInt(settlementId ?? 0), party],
      chainId: network.chainId,
    } as const)),
    query,
  });

  const partyStatuses = useMemo(() => {
    return partyStatusesQuery.data?.map(({ result }): PartyStatus | undefined => result && {
      isApproved: result[0],
      etherRequired: result[1],
      etherDeposited: result[2],
      tokenStatuses: [...result[3]],
    });
  }, [partyStatusesQuery.data]);

  const settlementKey = `${network.chainId}-${deployment.dvpAddress}-${settlementId}`;
  const formattedPartyStatusesQuery = useQuery({
    queryKey: ['formattedPartyStatuses', settlementKey, partyStatuses],
    queryFn: () => Promise.all(parties.map((party, index) => formatPartyStatus({
      address: party,
      error: partyStatusesQuery.data?.[index].error,
      networkDeployment,
      partyStatus: partyStatuses?.[index],
    }))),
    enabled: partyStatuses !== undefined,
    // Keep showing the last statuses while new ones are formatted, but not another settlement's.
    placeholderData: (previousData, previousQuery) => (
      previousQuery?.queryKey[1] === settlementKey ? previousData : undefined
    ),
    staleTime: Infinity,
  });

  const currentPartyStatus = address
    ? partyStatuses?.[parties.indexOf(address.toLowerCase() as Address)] ?? null
    : null;

  const allApprovalsComplete = Boolean(settlementApprovalQuery.data) && Boolean(partyStatuses?.every(
    partyStatus => partyStatus?.tokenStatuses.every(
      tokenStatus => tokenStatus.amountOrIdApprovedForDvp >= tokenStatus.amountOrIdRequired,
    ) ?? true,
  ));

  const loadingPartyStatuses = useMemo(() => parties.map((party): PartyApprovalStatus => ({
    address: party,
    isLoading: true,
    isApproved: false,
    etherRequired: 0n,
    etherDeposited: 0n,
    tokenStatuses: [],
  })), [parties]);

  const { refetch: refetchSettlementApproval } = settlementApprovalQuery;
  const { refetch: refetchPartyStatuses } = partyStatusesQuery;
  const refetch = useCallback(
    () => Promise.all([refetchSettlementApproval(), refetchPartyStatuses()]),
    [refetchSettlementApproval, refetchPartyStatuses],
  );

  return {
    partyStatuses: formattedPartyStatusesQuery.data ?? loadingPartyStatuses,
    hasLoaded: formattedPartyStatusesQuery.data !== undefined,
    currentPartyStatus,
    allApprovalsComplete,
    refetch,
  };
}

interface FormatPartyStatusOptions {
  address: Address;
  error: Error | undefined;
  networkDeployment: NetworkDeployment;
  partyStatus: PartyStatus | undefined;
}

/**
 * A party's status with its token amounts formatted for display, or the error which stopped it
 * being read.
 */
async function formatPartyStatus ({
  address,
  error,
  networkDeployment,
  partyStatus,
}: FormatPartyStatusOptions): Promise<PartyApprovalStatus> {
  if (!partyStatus) {
    const parsedError = errorManager.parse(error, { partyAddress: address });
    errorManager.log(parsedError, { partyAddress: address });
    return {
      address,
      isLoading: false,
      isApproved: false,
      etherRequired: 0n,
      etherDeposited: 0n,
      tokenStatuses: [],
      error: parsedError,
    };
  }

  return {
    ...partyStatus,
    address,
    isLoading: false,
    tokenStatuses: await Promise.all(partyStatus.tokenStatuses.map(
      tokenStatus => formatTokenStatus(tokenStatus, networkDeployment),
    )),
  };
}

async function formatTokenStatus (
  tokenStatus: TokenStatus,
  networkDeployment: NetworkDeployment,
): Promise<FormattedTokenStatus> {
  const { amountOrIdApprovedForDvp, amountOrIdHeldByParty, amountOrIdRequired, tokenAddress } = tokenStatus;
  const isMaxApproval = settlementManager.isMaxApproval(amountOrIdApprovedForDvp);

  try {
    return {
      ...tokenStatus,
      formattedRequired: await tokenManager.formatTokenAmount(amountOrIdRequired, tokenAddress, networkDeployment),
      formattedApproved: await tokenManager.formatTokenAmount(amountOrIdApprovedForDvp, tokenAddress, networkDeployment),
      formattedHeld: await tokenManager.formatTokenAmount(amountOrIdHeldByParty, tokenAddress, networkDeployment),
      symbol: await tokenManager.tokenSymbol(tokenAddress, networkDeployment),
      isMaxApproval,
    };
  } catch (error) {
    logger.error(`Error formatting token status for ${tokenAddress}:`, error);
    return {
      ...tokenStatus,
      formattedRequired: amountOrIdRequired.toString(),
      formattedApproved: amountOrIdApprovedForDvp.toString(),
      formattedHeld: amountOrIdHeldByParty.toString(),
      symbol: 'Unknown',
      isMaxApproval,
    };
  }
}

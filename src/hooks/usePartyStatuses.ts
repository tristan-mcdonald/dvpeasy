import { Address } from 'viem';
import { DVP_ABI } from '../config/contracts/abis';
import { errorManager } from '../lib/error-manager';
import {
  PartyStatus,
  PartyStatusForDisplay,
  Settlement,
  TokenStatus,
  TokenStatusForDisplay,
} from '../types/settlement';
import { settlementManager } from '../components/SettlementApprovals/utils';
import { settlements } from '../lib/settlements';
import { tokenManager } from '../lib/token-manager';
import { TokenMetadata } from '../lib/token-metadata';
import { TokenMetadataState, useTokensMetadata } from './useTokenMetadata';
import { useCallback, useMemo } from 'react';
import { useCurrentNetwork } from './useCurrentNetwork';
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
  const { deployment, network } = useCurrentNetwork();
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
    return partyStatusesQuery.data?.map(({ result }) => (
      result && settlements.partyStatusFromContract(result)
    ));
  }, [partyStatusesQuery.data]);

  const tokensMetadata = useTokensMetadata(settlement?.flows.map(flow => flow.token) ?? []);
  const formattedPartyStatuses = useMemo(() => {
    if (!partyStatuses || tokensMetadata.isLoading) return undefined;
    return parties.map((party, index) => formatPartyStatus({
      address: party,
      error: partyStatusesQuery.data?.[index].error,
      partyStatus: partyStatuses[index],
      tokensMetadataByAddress: tokensMetadata.byAddress,
    }));
  }, [parties, partyStatuses, partyStatusesQuery.data, tokensMetadata]);

  const currentPartyStatus = address
    ? partyStatuses?.[parties.indexOf(address.toLowerCase() as Address)] ?? null
    : null;

  const allApprovalsComplete = Boolean(settlementApprovalQuery.data) && Boolean(partyStatuses?.every(
    partyStatus => partyStatus?.tokenStatuses.every(settlements.isTokenApproved) ?? true,
  ));

  const loadingPartyStatuses = useMemo(() => parties.map((party): PartyStatusForDisplay => ({
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
    partyStatuses: formattedPartyStatuses ?? loadingPartyStatuses,
    hasLoaded: formattedPartyStatuses !== undefined,
    currentPartyStatus,
    allApprovalsComplete,
    refetch,
  };
}

interface FormatPartyStatusOptions {
  address: Address;
  error: Error | undefined;
  partyStatus: PartyStatus | undefined;
  tokensMetadataByAddress: Record<string, TokenMetadataState>;
}

/**
 * A party's status with its token amounts formatted for display, or the error which stopped it
 * being read.
 */
function formatPartyStatus ({
  address,
  error,
  partyStatus,
  tokensMetadataByAddress,
}: FormatPartyStatusOptions): PartyStatusForDisplay {
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
    tokenStatuses: partyStatus.tokenStatuses.map(tokenStatus => formatTokenStatus(
      tokenStatus,
      tokensMetadataByAddress[tokenStatus.tokenAddress.toLowerCase()]?.metadata,
    )),
  };
}

function formatTokenStatus (
  tokenStatus: TokenStatus,
  metadata: TokenMetadata | undefined,
): TokenStatusForDisplay {
  const { amountOrIdApprovedForDvp, amountOrIdHeldByParty, amountOrIdRequired } = tokenStatus;
  return {
    ...tokenStatus,
    formattedRequired: tokenManager.formatAmount(amountOrIdRequired, metadata),
    formattedApproved: tokenManager.formatAmount(amountOrIdApprovedForDvp, metadata),
    formattedHeld: tokenManager.formatAmount(amountOrIdHeldByParty, metadata),
    symbol: metadata?.symbol ?? 'Unknown',
    isMaxApproval: settlementManager.isMaxApproval(amountOrIdApprovedForDvp),
  };
}

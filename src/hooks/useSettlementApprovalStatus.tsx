import { config } from '../config/wagmi';
import { ContractErrorType, ContractReadError } from '../types/errors';
import { tokenManager } from '../lib/token-manager';
import { settlementManager } from '../components/SettlementApprovals/utils';
import { logger } from '../lib/logger';
import { errorManager } from '../lib/error-manager';
import { readContract } from 'wagmi/actions';
import { useCallback, useEffect, useState } from 'react';
import { useContractAddresses, useContractConfig } from './useContractConfig';

interface TokenStatus {
  tokenAddress: string;
  isNFT: boolean;
  amountOrIdRequired: bigint;
  amountOrIdApprovedForDvp: bigint;
  amountOrIdHeldByParty: bigint;
}

interface FormattedTokenStatus extends TokenStatus {
  formattedRequired: string;
  formattedApproved: string;
  formattedHeld: string;
  symbol: string;
  isMaxApproval: boolean;
}

interface PartyApprovalStatus {
  address: string;
  isLoading: boolean;
  isApproved: boolean;
  etherRequired: bigint;
  etherDeposited: bigint;
  tokenStatuses: FormattedTokenStatus[];
  error?: ContractErrorType;
}

interface Settlement {
  flows: Array<{
    from: string;
    to: string;
    token: string;
    isNFT: boolean;
  }>;
}

export function useSettlementApprovalStatus (
  settlementId: string | undefined,
  settlement: Settlement | null,
) {
  const { dvpAddress, dvpAbi } = useContractAddresses();
  const { config: contractConfig } = useContractConfig();
  const [partyStatuses, setPartyStatuses] = useState<PartyApprovalStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasEverLoaded, setHasEverLoaded] = useState(false);
  const [error, setError] = useState<ContractErrorType | null>(null);

  // Extract unique parties from settlement flows.
  const getUniqueParties = useCallback((flows: Settlement['flows']): string[] => {
    const parties = new Set<string>();
    flows.forEach(flow => {
      parties.add(flow.from.toLowerCase());
      parties.add(flow.to.toLowerCase());
    });
    return Array.from(parties);
  }, []);

  // Format token status with proper decimals and symbols.
  const formatTokenStatus = useCallback(async (tokenStatus: TokenStatus): Promise<FormattedTokenStatus> => {
    try {
      const formattedRequired = await tokenManager.formatTokenAmount(tokenStatus.amountOrIdRequired, tokenStatus.tokenAddress);
      const formattedApproved = await tokenManager.formatTokenAmount(tokenStatus.amountOrIdApprovedForDvp, tokenStatus.tokenAddress);
      const formattedHeld = await tokenManager.formatTokenAmount(tokenStatus.amountOrIdHeldByParty, tokenStatus.tokenAddress);

      // Extract symbol from formatted amount (e.g., "1.00 ETH" -> "ETH").
      const symbol = formattedRequired.split(' ').pop() || '';

      return {
        ...tokenStatus,
        formattedRequired,
        formattedApproved,
        formattedHeld,
        symbol,
        isMaxApproval: settlementManager.isMaxApproval(tokenStatus.amountOrIdApprovedForDvp),
      };
    } catch (error) {
      logger.error(`Error formatting token status for ${tokenStatus.tokenAddress}:`, error);
      return {
        ...tokenStatus,
        formattedRequired: tokenStatus.amountOrIdRequired.toString(),
        formattedApproved: tokenStatus.amountOrIdApprovedForDvp.toString(),
        formattedHeld: tokenStatus.amountOrIdHeldByParty.toString(),
        symbol: 'Unknown',
        isMaxApproval: settlementManager.isMaxApproval(tokenStatus.amountOrIdApprovedForDvp),
      };
    }
  }, []);

  // Fetch approval status for a single party.
  const fetchPartyStatus = useCallback(async (partyAddress: string): Promise<PartyApprovalStatus> => {
    if (!settlementId) {
      const error = new ContractReadError('No settlement ID');
      return {
        address: partyAddress,
        isLoading: false,
        isApproved: false,
        etherRequired: 0n,
        etherDeposited: 0n,
        tokenStatuses: [],
        error,
      };
    }

    try {
      const partyStatusData = await readContract(config, {
        address: dvpAddress,
        abi: dvpAbi,
        functionName: 'getSettlementPartyStatus',
        args: [BigInt(settlementId), partyAddress as `0x${string}`],
        chainId: contractConfig.chainId,
      });

      if (!partyStatusData) {
        throw new Error('No data returned');
      }

      // Type casting for party status data.
      const partyResult = partyStatusData as [boolean, bigint, bigint, TokenStatus[]];
      const [isApproved, etherRequired, etherDeposited, tokenStatuses] = partyResult;

      // Format all token statuses.
      const formattedTokenStatuses = await Promise.all(
        tokenStatuses.map((status: TokenStatus) => formatTokenStatus(status)),
      );

      return {
        address: partyAddress,
        isLoading: false,
        isApproved,
        etherRequired,
        etherDeposited,
        tokenStatuses: formattedTokenStatuses,
      };
    } catch (error) {
      const parsedError = errorManager.parse(error, { settlementId, partyAddress });
      errorManager.log(parsedError, { settlementId, partyAddress });
      return {
        address: partyAddress,
        isLoading: false,
        isApproved: false,
        etherRequired: 0n,
        etherDeposited: 0n,
        tokenStatuses: [],
        error: parsedError,
      };
    }
  }, [settlementId, formatTokenStatus, dvpAddress, dvpAbi, contractConfig.chainId]);

  // Fetch approval status for all parties.
  const fetchAllPartyStatuses = useCallback(async () => {
    if (!settlement?.flows.length || !settlementId) {
      setPartyStatuses([]);
      setHasEverLoaded(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const uniqueParties = getUniqueParties(settlement.flows);

      // Only set loading placeholders on initial load, not on refresh.
      if (!hasEverLoaded) {
        setPartyStatuses(
          uniqueParties.map(address => ({
            address,
            isLoading: true,
            isApproved: false,
            etherRequired: 0n,
            etherDeposited: 0n,
            tokenStatuses: [],
          })),
        );
      }

      // Fetch status for each party.
      const partyStatusPromises = uniqueParties.map(async (partyAddress) => {
        const status = await fetchPartyStatus(partyAddress);
        return status;
      });

      const results = await Promise.all(partyStatusPromises);
      setPartyStatuses(results);
      setHasEverLoaded(true);
    } catch (error) {
      const parsedError = errorManager.parse(error, { settlementId });
      errorManager.log(parsedError, { settlementId, operation: 'fetchAllPartyStatuses' });
      setError(parsedError);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settlement, settlementId, getUniqueParties, fetchPartyStatus]);

  // Load when settlement data becomes available.
  useEffect(() => {
    fetchAllPartyStatuses();
    /**
     * Use specific settlement properties instead of the entire settlement object to avoid infinite
     * loops when settlement is recreated during status updates.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settlement?.flows, settlementId]);

  return {
    partyStatuses,
    isLoading,
    hasEverLoaded,
    error,
    refetch: fetchAllPartyStatuses,
  };
}

import { errorManager } from '../lib/error-manager';
import { formatUnits } from 'viem';
import { settlementManager } from '../components/SettlementApprovals/utils';
import { tokenManager } from '../lib/token-manager';
import { useCallback, useEffect, useState } from 'react';

interface TokenStatus {
  tokenAddress: string;
  isNFT: boolean;
  amountOrIdRequired: bigint;
  amountOrIdApprovedForDvp: bigint;
  amountOrIdHeldByParty: bigint;
}

interface FormattedTokenStatus extends TokenStatus {
  formattedApproved: string;
  formattedRequired: string;
  symbol: string;
  isMaxApproval: boolean;
}

interface PartyStatus {
  tokenStatuses: TokenStatus[];
}

interface Settlement {
  flows: Array<{ token: string }>;
}

export function useTokenStatuses (
  partyStatus: PartyStatus | null,
  settlement: Settlement | null,
) {
  const [formattedTokenStatuses, setFormattedTokenStatuses] = useState<Record<string, FormattedTokenStatus[]>>({});

  const formatTokenStatuses = useCallback(async () => {
    if (!partyStatus?.tokenStatuses || !settlement?.flows.length) {
      return;
    }

    const formatted: Record<string, FormattedTokenStatus[]> = {};

    for (const flow of settlement.flows) {
      const statuses = partyStatus.tokenStatuses.filter(
        status => status.tokenAddress.toLowerCase() === flow.token.toLowerCase(),
      );

      if (statuses.length > 0) {
        try {
          const { decimals, symbol } = await tokenManager.tokenMetadata(flow.token);

          formatted[flow.token.toLowerCase()] = statuses.map(status => ({
            ...status,
            formattedApproved: formatUnits(status.amountOrIdApprovedForDvp, decimals),
            formattedRequired: formatUnits(status.amountOrIdRequired, decimals),
            symbol,
            isMaxApproval: settlementManager.isMaxApproval(status.amountOrIdApprovedForDvp),
          }));
        } catch (error) {
          const parsedError = errorManager.parse(error, { tokenAddress: flow.token });
          errorManager.log(parsedError, { tokenAddress: flow.token, operation: 'formatTokenStatuses' });
        }
      }
    }
    setFormattedTokenStatuses(formatted);
  }, [partyStatus?.tokenStatuses, settlement?.flows]);

  useEffect(() => {
    formatTokenStatuses();
  }, [formatTokenStatuses]);

  return formattedTokenStatuses;
}

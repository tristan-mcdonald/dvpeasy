import { contractConfigManager } from '../config/contracts';
import { chainManager } from './chain-manager';
import { getAddress } from 'viem';
import { logger } from './logger';

export interface ApprovalEvent {
  party: string;
  transactionHash: string;
  blockNumber: bigint;
}

/**
 * Centralized approval events manager.
 */
export const approvalEventsManager = {
  /**
   * All approval events for a specific settlement.
   */
  async settlementApprovalEvents (settlementId: string): Promise<ApprovalEvent[]> {
    try {
      // Validate settlementId is numeric before converting to BigInt.
      if (!/^\d+$/.test(settlementId)) {
        logger.error('Invalid settlement ID format for approval events:', settlementId);
        return [];
      }

      const currentConfig = contractConfigManager.getCurrentConfig();
      const publicClient = contractConfigManager.getPublicClient();

      // Query `SettlementApproved` events for this settlement.
      const logs = await publicClient.getLogs({
        address: currentConfig.dvpAddress,
        event: {
          type: 'event',
          name: 'SettlementApproved',
          inputs: [
            { name: 'settlementId', type: 'uint256', indexed: true },
            { name: 'party', type: 'address', indexed: true },
          ],
        },
        args: {
          settlementId: BigInt(settlementId),
        },
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      return logs.map((log) => ({
        party: getAddress(log.args.party || ''),
        transactionHash: log.transactionHash || '',
        blockNumber: log.blockNumber || 0n,
      })).filter(event => event.party !== '0x0000000000000000000000000000000000000000');
    } catch (error) {
      logger.error('Failed to fetch approval events:', error);
      return [];
    }
  },

  /**
   * Blockchain explorer URL for a transaction hash.
   */
  transactionUrl (txHash: string, chainId?: number): string {
    const currentChainId = chainId || contractConfigManager.getCurrentConfig().chainId;
    return chainManager.blockExplorerTransactionUrl(currentChainId, txHash) || `https://sepolia.etherscan.io/tx/${txHash}`;
  },
};

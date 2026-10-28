import { Address, erc20Abi, erc721Abi, formatUnits, parseUnits } from 'viem';
import { AssetType, TokenMetadata } from './token-metadata';
import { config } from '../config/wagmi';
import { ContractValidationError, contractValidationManager } from './contract-validation';
import { logger } from './logger';
import { NetworkDeployment } from '../config/contracts/deployments';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';

/**
 * Converting token amounts between what users read and type and what the contract holds, and
 * approving the DVP contract to move a token.
 */
export const tokenManager = {
  /**
   * An amount for display: the NFT's ID, or the amount in whole tokens, with the token's symbol.
   * Without the token's details, the amount in base units.
   */
  formatAmount (amount: bigint, metadata: TokenMetadata | undefined): string {
    if (!metadata) return `${amount} base units`;
    if (metadata.assetType === AssetType.ERC721) return `${metadata.symbol} #${amount}`;
    return `${formatUnits(amount, metadata.decimals)} ${metadata.symbol}`;
  },

  /**
   * A balance in whole tokens, as wagmi formats it, to four decimal places.
   */
  formatBalance (formattedBalance: string): string {
    return parseFloat(formattedBalance).toFixed(4);
  },

  /**
   * The amount the contract expects for what the user typed: the NFT's ID, or the amount in the
   * token's base units.
   */
  parseAmount (amount: string, metadata: TokenMetadata): bigint {
    if (!amount || typeof amount !== 'string') {
      throw new ContractValidationError('Invalid amount format', amount, 'amount');
    }

    if (metadata.assetType === AssetType.ERC721) {
      return contractValidationManager.validateAmountOrId(amount, true);
    }

    try {
      const parsedAmount = parseUnits(amount, metadata.decimals);
      contractValidationManager.validateAmountOrId(parsedAmount, false);
      return parsedAmount;
    } catch (error) {
      if (error instanceof ContractValidationError) throw error;
      logger.error('Error parsing token amount:', error);
      throw new ContractValidationError(
        `Failed to parse token amount: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { amount },
        'parseAmount',
      );
    }
  },

  /**
   * Approve token spending for contracts.
   * Handles both ERC20 and ERC721 approval flows, and resolves once the approval is mined.
   */
  async approveToken ({
    account,
    amount,
    assetType,
    networkDeployment,
    spender,
    tokenAddress,
  }: {
    account: string;
    amount: bigint;
    assetType: AssetType;
    networkDeployment: NetworkDeployment;
    spender: string;
    tokenAddress: string;
  }): Promise<string> {
    const hash = await writeContract(config, {
      address: tokenAddress as Address,
      abi: assetType === AssetType.ERC721 ? erc721Abi : erc20Abi,
      functionName: 'approve',
      args: [spender as Address, amount],
      account: account as Address,
      chainId: networkDeployment.network.chainId,
    });
    await waitForTransactionReceipt(config, { hash, chainId: networkDeployment.network.chainId });
    return hash;
  },
};

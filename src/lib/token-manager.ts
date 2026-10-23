import { Address, erc20Abi, erc721Abi, formatUnits, parseUnits } from 'viem';
import { AssetType, readTokenMetadata, TokenMetadata } from './token-metadata';
import { config } from '../config/wagmi';
import { ContractValidationError, contractValidationManager } from './contract-validation';
import { logger } from './logger';
import { NetworkDeployment } from '../config/contracts/deployments';
import { TokenDetectionError } from '../types/errors';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';

// Re-export TokenDetectionError for external use.
export { TokenDetectionError };

// Token metadata, keyed by chain ID and address, since an address can hold different tokens on
// different chains.
const tokenCache = new Map<string, TokenMetadata>();

/**
 * Token management utilities following the manager pattern.
 * Provides methods for token operations including detection, metadata, and transactions.
 */
export const tokenManager = {
  /**
   * Token metadata retrieval for token addresses.
   * Returns comprehensive metadata including decimals, symbol, name, and type.
   */
  async tokenMetadata (tokenAddress: string, networkDeployment: NetworkDeployment): Promise<TokenMetadata> {
    const cacheKey = `${networkDeployment.network.chainId}:${tokenAddress.toLowerCase()}`;
    const cached = tokenCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const metadata = await readTokenMetadata(tokenAddress.toLowerCase() as Address, networkDeployment);
    tokenCache.set(cacheKey, metadata);
    return metadata;
  },

  /**
   * Token symbol for a given address.
   * Returns just the symbol property from token metadata.
   */
  async tokenSymbol (tokenAddress: string, networkDeployment: NetworkDeployment): Promise<string> {
    const metadata = await this.tokenMetadata(tokenAddress, networkDeployment);
    return metadata.symbol;
  },

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

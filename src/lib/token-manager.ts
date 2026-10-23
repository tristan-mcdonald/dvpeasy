import { Address, erc20Abi, erc721Abi, formatUnits, parseUnits } from 'viem';
import { AssetType, readAssetType, readTokenMetadata, TokenMetadata } from './token-metadata';
import { config, publicClientFor } from '../config/wagmi';
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
   * Asset type detection for token addresses.
   * Determines if a token is ETH, ERC20, or ERC721.
   */
  detectAssetType (tokenAddress: string, networkDeployment: NetworkDeployment): Promise<AssetType> {
    return readAssetType(tokenAddress, networkDeployment);
  },

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
   * NFT balance for a given owner address.
   * Uses ERC721 balanceOf method to check how many NFTs an address owns.
   */
  async nftBalance (tokenAddress: string, ownerAddress: string, chainId: number): Promise<bigint> {
    return await publicClientFor(chainId).readContract({
      address: tokenAddress as Address,
      abi: erc721Abi,
      functionName: 'balanceOf',
      args: [ownerAddress as Address],
    });
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
   * Parse token amount from string input.
   * Converts human-readable amounts to raw token amounts.
   */
  async parseTokenAmount (
    amount: string,
    tokenAddress: string,
    networkDeployment: NetworkDeployment,
  ): Promise<bigint> {
    // Validate inputs.
    if (!amount || typeof amount !== 'string') {
      throw new ContractValidationError('Invalid amount format', amount, 'amount');
    }

    if (!contractValidationManager.isValidAddress(tokenAddress)) {
      throw new ContractValidationError('Invalid token address format', tokenAddress, 'tokenAddress');
    }

    try {
      const { assetType, decimals } = await this.tokenMetadata(tokenAddress, networkDeployment);

      if (assetType === AssetType.ERC721) {
        // For NFTs, amount should be a token ID.
        const tokenId = contractValidationManager.validateAmountOrId(amount, true);
        return tokenId;
      } else {
        // For ERC20 tokens, parse with decimals.
        const parsedAmount = parseUnits(amount, decimals);
        contractValidationManager.validateAmountOrId(parsedAmount, false);
        return parsedAmount;
      }
    } catch (error) {
      if (error instanceof ContractValidationError || error instanceof TokenDetectionError) {
        throw error;
      }
      logger.error('Error parsing token amount:', error);
      throw new ContractValidationError(
        `Failed to parse token amount: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { amount, tokenAddress },
        'parseTokenAmount',
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
    networkDeployment,
    spender,
    tokenAddress,
  }: {
    account: string;
    amount: bigint;
    networkDeployment: NetworkDeployment;
    spender: string;
    tokenAddress: string;
  }): Promise<string> {
    const assetType = await this.detectAssetType(tokenAddress, networkDeployment);
    const hash = await writeContract(config, {
      address: tokenAddress as Address,
      abi: assetType === AssetType.ERC721 ? erc721Abi : erc20Abi,
      functionName: 'approve',
      args: assetType === AssetType.ERC721
        ? [spender as Address, amount]
        : [spender as Address, amount],
      account: account as Address,
      chainId: networkDeployment.network.chainId,
    });
    await waitForTransactionReceipt(config, { hash, chainId: networkDeployment.network.chainId });
    return hash;
  },
};

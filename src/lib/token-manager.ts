import { Address, formatUnits, parseUnits } from 'viem';
import { config, publicClientFor } from '../config/wagmi';
import { ContractValidationError, contractValidationManager } from './contract-validation';
import { DVP_ABI } from '../config/contracts/abis';
import { logger } from './logger';
import { NetworkDeployment } from '../config/contracts/deployments';
import { TokenDetectionError } from '../types/errors';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';

// Re-export TokenDetectionError for external use.
export { TokenDetectionError };

// Token metadata interface with strict typing.
export interface TokenMetadata {
  decimals: number;
  symbol: string;
  name?: string;
  isNFT: boolean;
  isTestnetFallback?: boolean;
}

const ERC20_ABI = [
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

const ERC721_ABI = [
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

// Known token metadata with typing.
const KNOWN_TOKENS: Record<string, TokenMetadata> = {
  '0x362637240ef6D0088ec318755D4566218443d88B': {
    decimals: 6,
    symbol: 'TUSDC',
    name: 'Test USDC',
    isNFT: false,
  },
  '0xcFeec17722A0F37219A93bB4D83aE97C998A8827': {
    decimals: 6,
    symbol: 'rTBL',
    name: 'Reown Table Token',
    isNFT: false,
  },
  // Avalanche Fuji testnet TUSDC.
  '0x700A55267Dad74763b4B5f0C0B727B6a86DD58D3': {
    decimals: 6,
    symbol: 'TUSDC',
    name: 'Test USDC',
    isNFT: false,
  },
  // Avalanche C-Chain mainnet TUSDC.
  '0xB01eEb9738bA0eb359af18052696503B8d2c5595': {
    decimals: 6,
    symbol: 'TUSDC',
    name: 'Test USDC',
    isNFT: false,
  },

  // Testnet fallback tokens (use mainnet addresses but skip DVP validation).
  '0xA0b86a33E6435E6E4C4a67b2C2C4A95a98F1a4e6': {
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    isNFT: false,
    isTestnetFallback: true,
  },
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    decimals: 6,
    symbol: 'USDT',
    name: 'Tether USD',
    isNFT: false,
    isTestnetFallback: true,
  },
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
    decimals: 18,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    isNFT: false,
    isTestnetFallback: true,
  },
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': {
    decimals: 18,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    isNFT: false,
    isTestnetFallback: true,
  },
};

// Token metadata, keyed by chain ID and address, since an address can hold different tokens on
// different chains.
const tokenCache = new Map<string, TokenMetadata>();

export enum AssetType {
  ETH = 'ETH',
  ERC20 = 'ERC20',
  ERC721 = 'ERC721'
}

/**
 * Token management utilities following the manager pattern.
 * Provides methods for token operations including detection, metadata, and transactions.
 */
export const tokenManager = {
  /**
   * Asset type detection for token addresses.
   * Determines if a token is ETH, ERC20, or ERC721.
   */
  async detectAssetType (tokenAddress: string, networkDeployment: NetworkDeployment): Promise<AssetType> {
    // Validate input address format.
    if (!tokenAddress || !contractValidationManager.isValidAddress(tokenAddress)) {
      throw new ContractValidationError('Invalid token address format', tokenAddress, 'tokenAddress');
    }

    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      return AssetType.ETH;
    }

    const normalizedAddress = tokenAddress.toLowerCase();
    const knownToken = KNOWN_TOKENS[normalizedAddress];

    try {
      const { deployment, network } = networkDeployment;
      const publicClient = publicClientFor(network.chainId);

      // Skip DVP validation for testnet fallback tokens on testnets.
      if (knownToken?.isTestnetFallback && network.isTestnet) {
        // Use direct interface detection instead of DVP validation.
        try {
          // Try to call ERC20 functions first (most common).
          await publicClient.readContract({
            address: tokenAddress as Address,
            abi: ERC20_ABI,
            functionName: 'symbol',
          });

          // If symbol() works, it's likely ERC20.
          return AssetType.ERC20;
        } catch {
          // If ERC20 fails, try ERC721.
          try {
            await publicClient.readContract({
              address: tokenAddress as Address,
              abi: ERC721_ABI,
              functionName: 'symbol',
            });

            return AssetType.ERC721;
          } catch {
            // If both fail, default to ERC20 for testnet fallback tokens.
            logger.warn(`Direct interface detection failed for ${tokenAddress}, defaulting to ERC20`);
            return AssetType.ERC20;
          }
        }
      }

      // Use DVP validation for non-testnet-fallback tokens or on mainnets.
      const [isERC721, isERC20] = await Promise.all([
        publicClient.readContract({
          address: deployment.dvpAddress,
          abi: DVP_ABI,
          functionName: 'isERC721',
          args: [tokenAddress as Address],
        }),
        publicClient.readContract({
          address: deployment.dvpAddress,
          abi: DVP_ABI,
          functionName: 'isERC20',
          args: [tokenAddress as Address],
        }),
      ]);

      if (isERC721) {
        return AssetType.ERC721;
      }

      if (isERC20) {
        return AssetType.ERC20;
      }

      throw new TokenDetectionError(
        'Token address does not implement a supported interface (ERC20 or ERC721)',
        tokenAddress,
      );
    } catch (error) {
      if (error instanceof TokenDetectionError) {
        throw error;
      }
      throw new TokenDetectionError(
        `Failed to detect token type: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tokenAddress,
      );
    }
  },

  /**
   * Token metadata retrieval for token addresses.
   * Returns comprehensive metadata including decimals, symbol, name, and type.
   */
  async tokenMetadata (tokenAddress: string, networkDeployment: NetworkDeployment): Promise<TokenMetadata> {
    // Validate input address format.
    if (!contractValidationManager.isValidAddress(tokenAddress)) {
      throw new ContractValidationError('Invalid token address format', tokenAddress, 'tokenAddress');
    }

    const normalizedAddress = tokenAddress.toLowerCase();

    // Special handling for native token (0x0000...0000).
    if (normalizedAddress === '0x0000000000000000000000000000000000000000') {
      const { nativeToken } = networkDeployment.network;
      return {
        decimals: nativeToken.decimals,
        symbol: nativeToken.symbol,
        name: nativeToken.name,
        isNFT: false,
      };
    }

    // Check known tokens.
    const knownToken = KNOWN_TOKENS[normalizedAddress];
    if (knownToken) {
      return knownToken;
    }

    const cacheKey = `${networkDeployment.network.chainId}:${normalizedAddress}`;
    const cached = tokenCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const assetType = await this.detectAssetType(tokenAddress, networkDeployment);
      const publicClient = publicClientFor(networkDeployment.network.chainId);
      let metadata: TokenMetadata;

      if (assetType === AssetType.ERC721) {
        const [symbol, name] = await Promise.all([
          publicClient.readContract({
            address: tokenAddress as Address,
            abi: ERC721_ABI,
            functionName: 'symbol',
          }).catch(() => 'NFT'),
          publicClient.readContract({
            address: tokenAddress as Address,
            abi: ERC721_ABI,
            functionName: 'name',
          }).catch(() => 'Unknown NFT'),
        ]);
        metadata = {
          decimals: 0,
          symbol: symbol || 'NFT',
          name: name || 'Unknown NFT',
          isNFT: true,
        };
      } else {
        const [decimals, symbol, name] = await Promise.all([
          // Decimals have no safe default: a wrong guess scales every amount by a power of ten.
          publicClient.readContract({
            address: tokenAddress as Address,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }).catch((error) => {
            throw new TokenDetectionError('Could not read the token\'s decimals; please try again', tokenAddress, error);
          }),
          publicClient.readContract({
            address: tokenAddress as Address,
            abi: ERC20_ABI,
            functionName: 'symbol',
          }).catch(() => 'TOKEN'),
          publicClient.readContract({
            address: tokenAddress as Address,
            abi: ERC20_ABI,
            functionName: 'name',
          }).catch(() => 'Unknown Token'),
        ]);
        metadata = {
          decimals,
          symbol: symbol || 'TOKEN',
          name: name || 'Unknown Token',
          isNFT: false,
        };
      }

      tokenCache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      if (error instanceof ContractValidationError || error instanceof TokenDetectionError) {
        throw error;
      }
      throw new TokenDetectionError('Could not read the token\'s details; please try again', tokenAddress, error);
    }
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
      abi: ERC721_ABI,
      functionName: 'balanceOf',
      args: [ownerAddress as Address],
    });
  },

  /**
   * Format token amount for display.
   * Converts raw token amounts to human-readable format with symbol.
   */
  async formatTokenAmount (
    amount: bigint,
    tokenAddress: string,
    networkDeployment: NetworkDeployment,
  ): Promise<string> {
    try {
      const metadata = await this.tokenMetadata(tokenAddress, networkDeployment);
      const { decimals, symbol } = metadata;
      const isNFT = metadata.isNFT || false;
      if (isNFT) {
        return ` ${symbol} #${amount.toString()}`;
      }
      const formatted = formatUnits(amount, decimals);
      return `${formatted} ${symbol}`;
    } catch (error) {
      logger.error('Error formatting token amount:', error);
      return `${amount.toString()} base units`;
    }
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
      const metadata = await this.tokenMetadata(tokenAddress, networkDeployment);
      const { decimals, isNFT } = metadata;

      if (isNFT) {
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
      abi: assetType === AssetType.ERC721 ? ERC721_ABI : ERC20_ABI,
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

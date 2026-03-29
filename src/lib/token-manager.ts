import { Address, formatUnits, parseUnits } from 'viem';
import { chainManager } from './chain-manager';
import { config } from '../config/wagmi';
import { contractConfigManager } from '../config/contracts';
import { ContractValidationError, contractValidationManager } from './contract-validation';
import { logger } from './logger';
import { TokenDetectionError } from '../types/errors';
import { writeContract } from 'wagmi/actions';

// Re-export TokenDetectionError for external use.
export { TokenDetectionError };

// ChainID.network API response interfaces.
interface ChainIdNetworkNativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

interface ChainIdNetworkChain {
  chainId: number;
  name: string;
  nativeCurrency: ChainIdNetworkNativeCurrency;
}

// Token metadata interface with strict typing.
export interface TokenMetadata {
  decimals: number;
  symbol: string;
  name?: string;
  isNFT: boolean;
  isTestnetFallback?: boolean;
}

// Branded type for token addresses to prevent mixing with other addresses.
export type TokenAddress = Address & { readonly _brand: 'TokenAddress' };

// Helper function to create branded token address.
export function createTokenAddress (address: string): TokenAddress {
  if (!contractValidationManager.isValidAddress(address)) {
    throw new ContractValidationError('Invalid token address format', address, 'TokenAddress');
  }
  return address as TokenAddress;
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

// Cache for token metadata with proper typing.
const tokenCache = new Map<string, TokenMetadata>();

// Cache for chainid.network data to avoid repeated API calls.
const chainDataCache = new Map<number, ChainIdNetworkNativeCurrency>();
let chainDataFetchTime = 0;
const CHAIN_DATA_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds.

/**
 * Fetches native currency information from chainid.network for a specific chain ID.
 * Uses caching to minimize API calls and improve performance.
 * Exported for testing purposes.
 */
export async function fetchChainNativeCurrency (chainId: number): Promise<ChainIdNetworkNativeCurrency | undefined> {
  // Check if we have cached data that's still fresh.
  const now = Date.now();
  if (chainDataCache.has(chainId) && (now - chainDataFetchTime) < CHAIN_DATA_CACHE_DURATION) {
    return chainDataCache.get(chainId);
  }

  try {
    // Only fetch new data if cache is empty or stale.
    const shouldFetchNew = chainDataCache.size === 0 || (now - chainDataFetchTime) >= CHAIN_DATA_CACHE_DURATION;

    if (shouldFetchNew) {
      logger.info(`Fetching chain data from chainid.network for chain ${chainId}`);

      const response = await fetch('https://chainid.network/chains.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const chains: ChainIdNetworkChain[] = await response.json();

      // Update cache with fresh data.
      chainDataCache.clear();
      chains.forEach((chain) => {
        if (chain.chainId && chain.nativeCurrency) {
          chainDataCache.set(chain.chainId, chain.nativeCurrency);
        }
      });

      chainDataFetchTime = now;
      logger.info(`Cached ${chainDataCache.size} chain configurations from chainid.network`);
    }

    return chainDataCache.get(chainId);
  } catch (error) {
    logger.warn(`Failed to fetch chain data from chainid.network for chain ${chainId}:`, error);
    return undefined;
  }
}

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
  async detectAssetType (tokenAddress: string): Promise<AssetType> {
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
      const currentConfig = contractConfigManager.getCurrentConfig();
      const publicClient = contractConfigManager.getPublicClient();
      const chainId = await publicClient.getChainId();

      // Skip DVP validation for testnet fallback tokens on testnets.
      if (knownToken?.isTestnetFallback && chainManager.isTestnetChain(chainId)) {
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
          address: currentConfig.dvpAddress,
          abi: currentConfig.dvpAbi,
          functionName: 'isERC721',
          args: [tokenAddress as Address],
        }),
        publicClient.readContract({
          address: currentConfig.dvpAddress,
          abi: currentConfig.dvpAbi,
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
  async tokenMetadata (tokenAddress: string): Promise<TokenMetadata> {
    // Validate input address format.
    if (!contractValidationManager.isValidAddress(tokenAddress)) {
      throw new ContractValidationError('Invalid token address format', tokenAddress, 'tokenAddress');
    }

    const normalizedAddress = tokenAddress.toLowerCase();

    // Special handling for native token (0x0000...0000).
    if (normalizedAddress === '0x0000000000000000000000000000000000000000') {
      const publicClient = contractConfigManager.getPublicClient();
      const chainId = await publicClient.getChainId();
      const chainConfig = chainManager.chainConfig(chainId);

      if (chainConfig) {
        return {
          decimals: chainConfig.nativeToken.decimals,
          symbol: chainConfig.nativeToken.symbol,
          name: chainConfig.nativeToken.name,
          isNFT: false,
        };
      }

      // Fallback if chain config not found - use chainid.network as backup.
      try {
        const chainNativeCurrency = await fetchChainNativeCurrency(chainId);
        if (chainNativeCurrency) {
          return {
            decimals: chainNativeCurrency.decimals,
            symbol: chainNativeCurrency.symbol,
            name: chainNativeCurrency.name,
            isNFT: false,
          };
        }
      } catch (error) {
        logger.warn(`Failed to fetch chain data for chain ${chainId}, using ETH fallback:`, error);
      }

      // Final fallback to ETH if chainid.network lookup fails.
      return {
        decimals: 18,
        symbol: 'ETH',
        name: 'Native token',
        isNFT: false,
      };
    }

    // Check known tokens.
    const knownToken = KNOWN_TOKENS[normalizedAddress];
    if (knownToken) {
      return knownToken;
    }

    // Check cache.
    const cached = tokenCache.get(normalizedAddress);
    if (cached) {
      return cached;
    }

    try {
      const assetType = await this.detectAssetType(tokenAddress);
      const publicClient = contractConfigManager.getPublicClient();
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
          publicClient.readContract({
            address: tokenAddress as Address,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }).catch(() => 18),
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
          decimals: decimals || 18,
          symbol: symbol || 'TOKEN',
          name: name || 'Unknown Token',
          isNFT: false,
        };
      }

      tokenCache.set(normalizedAddress, metadata);
      return metadata;
    } catch (error) {
      if (error instanceof ContractValidationError) {
        throw error;
      }
      logger.warn(`Could not read metadata for token ${tokenAddress}, using defaults:`, error);
      // Default to 18 decimals and a placeholder symbol.
      const metadata: TokenMetadata = {
        decimals: 18,
        symbol: 'TOKEN',
        name: 'Unknown Token',
        isNFT: false,
      };
      tokenCache.set(normalizedAddress, metadata);
      return metadata;
    }
  },

  /**
   * Token symbol for a given address.
   * Returns just the symbol property from token metadata.
   */
  async tokenSymbol (tokenAddress: string): Promise<string> {
    const metadata = await this.tokenMetadata(tokenAddress);
    return metadata.symbol;
  },

  /**
   * NFT balance for a given owner address.
   * Uses ERC721 balanceOf method to check how many NFTs an address owns.
   */
  async nftBalance (tokenAddress: string, ownerAddress: string): Promise<bigint> {
    const publicClient = contractConfigManager.getPublicClient();
    return await publicClient.readContract({
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
  async formatTokenAmount (amount: bigint, tokenAddress: string): Promise<string> {
    try {
      const metadata = await this.tokenMetadata(tokenAddress);
      const { decimals, symbol } = metadata;
      const isNFT = metadata.isNFT || false;
      if (isNFT) {
        return ` ${symbol} #${amount.toString()}`;
      }
      const formatted = formatUnits(amount, decimals);
      return `${formatted} ${symbol}`;
    } catch (error) {
      logger.error('Error formatting token amount:', error);
      return `${formatUnits(amount, 18)} TOKEN`;
    }
  },

  /**
   * Parse token amount from string input.
   * Converts human-readable amounts to raw token amounts.
   */
  async parseTokenAmount (amount: string, tokenAddress: string): Promise<bigint> {
    // Validate inputs.
    if (!amount || typeof amount !== 'string') {
      throw new ContractValidationError('Invalid amount format', amount, 'amount');
    }

    if (!contractValidationManager.isValidAddress(tokenAddress)) {
      throw new ContractValidationError('Invalid token address format', tokenAddress, 'tokenAddress');
    }

    try {
      const metadata = await this.tokenMetadata(tokenAddress);
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
      if (error instanceof ContractValidationError) {
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
   * Handles both ERC20 and ERC721 approval flows.
   */
  async approveToken (
    tokenAddress: string,
    spender: string,
    amount: bigint,
    account: string,
  ): Promise<string> {
    const assetType = await this.detectAssetType(tokenAddress);
    const hash = await writeContract(config, {
      address: tokenAddress as Address,
      abi: assetType === AssetType.ERC721 ? ERC721_ABI : ERC20_ABI,
      functionName: 'approve',
      args: assetType === AssetType.ERC721
        ? [spender as Address, amount]
        : [spender as Address, amount],
      account: account as Address,
    });
    return hash;
  },
};

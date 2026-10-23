import { Address, erc20Abi, erc721Abi, isAddress, zeroAddress } from 'viem';
import { ContractValidationError, contractValidationManager } from './contract-validation';
import { DVP_ABI } from '../config/contracts/abis';
import { NetworkDeployment } from '../config/contracts/deployments';
import { publicClientFor } from '../config/wagmi';
import { queryOptions } from '@tanstack/react-query';
import { TokenDetails } from '../config/networks';
import { TokenDetectionError, UnsupportedTokenError } from '../types/errors';

export enum AssetType {
  ETH = 'ETH',
  ERC20 = 'ERC20',
  ERC721 = 'ERC721'
}

export interface TokenMetadata extends Omit<TokenDetails, 'address'> {
  assetType: AssetType;
}

interface TokenMetadataQueryOptions {
  networkDeployment: NetworkDeployment;
  tokenAddress: string;
}

/**
 * The query for a token's type, decimals, symbol and name, shared by every component and action
 * which needs them, so that each token is read once per network.
 */
export function tokenMetadataQuery ({ networkDeployment, tokenAddress }: TokenMetadataQueryOptions) {
  const { deployment, network } = networkDeployment;
  const address = tokenAddress.toLowerCase() as Address;

  return queryOptions({
    // The DVP contract is in the key because it's what decides whether a token is supported.
    queryKey: ['tokenMetadata', network.chainId, deployment.dvpAddress, address],
    queryFn: () => readTokenMetadata(address, networkDeployment),
    enabled: isAddress(tokenAddress),
    // A token's details don't change once it's deployed.
    staleTime: Infinity,
  });
}

/**
 * Reads a token's details from its contract, or from the network's record for the native token.
 */
async function readTokenMetadata (
  tokenAddress: Address,
  networkDeployment: NetworkDeployment,
): Promise<TokenMetadata> {
  if (tokenAddress === zeroAddress) {
    const { decimals, name, symbol } = networkDeployment.network.nativeToken;
    return { assetType: AssetType.ETH, decimals, name, symbol };
  }

  const assetType = await readAssetType(tokenAddress, networkDeployment);
  const publicClient = publicClientFor(networkDeployment.network.chainId);

  try {
    if (assetType === AssetType.ERC721) {
      const [symbol, name] = await Promise.all([
        publicClient.readContract({ address: tokenAddress, abi: erc721Abi, functionName: 'symbol' })
          .catch(() => 'NFT'),
        publicClient.readContract({ address: tokenAddress, abi: erc721Abi, functionName: 'name' })
          .catch(() => 'Unknown NFT'),
      ]);
      return { assetType, decimals: 0, name: name || 'Unknown NFT', symbol: symbol || 'NFT' };
    }

    const [decimals, symbol, name] = await Promise.all([
      // Decimals have no safe default: a wrong guess scales every amount by a power of ten.
      publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'decimals' })
        .catch((error) => {
          throw new TokenDetectionError('Could not read the token\'s decimals; please try again', tokenAddress, error);
        }),
      publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'symbol' })
        .catch(() => 'TOKEN'),
      publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: 'name' })
        .catch(() => 'Unknown Token'),
    ]);
    return { assetType, decimals, name: name || 'Unknown Token', symbol: symbol || 'TOKEN' };
  } catch (error) {
    if (error instanceof TokenDetectionError) throw error;
    throw new TokenDetectionError('Could not read the token\'s details; please try again', tokenAddress, error);
  }
}

/**
 * Whether a token is the native token, an ERC-20 or an ERC-721, as the DVP contract sees it.
 */
async function readAssetType (
  tokenAddress: string,
  networkDeployment: NetworkDeployment,
): Promise<AssetType> {
  if (!tokenAddress || !contractValidationManager.isValidAddress(tokenAddress)) {
    throw new ContractValidationError('Invalid token address format', tokenAddress, 'tokenAddress');
  }

  if (tokenAddress === zeroAddress) {
    return AssetType.ETH;
  }

  const { deployment, network } = networkDeployment;
  const publicClient = publicClientFor(network.chainId);

  try {
    const [isERC721, isERC20] = await Promise.all([
      publicClient.readContract({
        address: deployment.dvpAddress,
        abi: DVP_ABI,
        functionName: 'isERC721',
        args: [tokenAddress],
      }),
      publicClient.readContract({
        address: deployment.dvpAddress,
        abi: DVP_ABI,
        functionName: 'isERC20',
        args: [tokenAddress],
      }),
    ]);

    if (isERC721) return AssetType.ERC721;
    if (isERC20) return AssetType.ERC20;
  } catch (error) {
    throw new TokenDetectionError(
      `Failed to detect token type: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tokenAddress,
    );
  }

  throw new UnsupportedTokenError(tokenAddress);
}

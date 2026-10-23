import { Address, erc721Abi } from 'viem';
import { logger } from './logger';
import { publicClientFor } from '../config/wagmi';
import { queryOptions } from '@tanstack/react-query';

export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// IPFS gateway fallbacks in order of preference.
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
];

class NFTMetadataError extends Error {
  constructor (message: string, public tokenAddress: string, public tokenId: string) {
    super(message);
    this.name = 'NFTMetadataError';
  }
}

/**
 * Normalizes IPFS URIs to use HTTP gateways.
 */
function normalizeIPFSUri (uri: string): string {
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[0]}${hash}`;
  }
  return uri;
}

/**
 * Fetches JSON data from a URI with timeout and error handling.
 */
async function fetchWithTimeout (url: string, timeoutMs = 10000): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * NFT manager for NFT metadata and image operations.
 * Provides methods for fetching NFT metadata, images, and preloading functionality.
 */
export const nftManager = {
  /**
   * Fetches the tokenURI for an NFT from the blockchain.
   */
  async getTokenURI (tokenAddress: string, tokenId: string, chainId: number): Promise<string> {
    try {
      const uri = await publicClientFor(chainId).readContract({
        address: tokenAddress as Address,
        abi: erc721Abi,
        functionName: 'tokenURI',
        args: [BigInt(tokenId)],
      });

      if (!uri || typeof uri !== 'string') {
        throw new Error('Invalid or empty tokenURI');
      }

      return uri;
    } catch (error) {
      throw new NFTMetadataError(
        `Failed to fetch tokenURI: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tokenAddress,
        tokenId,
      );
    }
  },

  /**
   * Fetches NFT metadata from a tokenURI.
   */
  async fetchNFTMetadata (tokenAddress: string, tokenId: string, chainId: number): Promise<NFTMetadata> {
    try {
      // Get tokenURI from contract.
      const tokenURI = await this.getTokenURI(tokenAddress, tokenId, chainId);

      // Normalize IPFS URIs.
      const normalizedURI = normalizeIPFSUri(tokenURI);

      // Fetch metadata JSON.
      const metadataResponse = await fetchWithTimeout(normalizedURI);

      // Validate metadata structure.
      if (!metadataResponse || typeof metadataResponse !== 'object') {
        throw new Error('Invalid metadata format');
      }

      // Type assertion for metadata.
      const metadata = metadataResponse as NFTMetadata;

      // Normalize image URI if present.
      if (metadata.image) {
        metadata.image = normalizeIPFSUri(metadata.image);
      }

      return metadata;
    } catch (error) {
      throw new NFTMetadataError(
        `Failed to fetch NFT metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tokenAddress,
        tokenId,
      );
    }
  },

  /**
   * Fetches just the image URL for an NFT.
   */
  async fetchNFTImage (tokenAddress: string, tokenId: string, chainId: number): Promise<string | null> {
    try {
      const metadata = await this.fetchNFTMetadata(tokenAddress, tokenId, chainId);
      return metadata.image || null;
    } catch (error) {
      logger.warn(`Failed to fetch NFT image for ${tokenAddress}/${tokenId}:`, error);
      return null;
    }
  },

  /**
   * The query for the URL of an NFT's image which loads. A missing image fails the query rather
   * than being cached, so that it's tried again on the next mount.
   */
  imageQuery ({ chainId, tokenAddress, tokenId }: { chainId: number; tokenAddress: string; tokenId: string }) {
    return queryOptions({
      queryKey: ['nftImage', chainId, tokenAddress.toLowerCase(), tokenId],
      queryFn: async () => {
        const url = await this.fetchNFTImage(tokenAddress, tokenId, chainId);
        if (!url || !await this.preloadImage(url)) {
          throw new NFTMetadataError('No image which loads', tokenAddress, tokenId);
        }
        return url;
      },
      enabled: Boolean(tokenAddress && tokenId),
      retry: false,
      staleTime: Infinity,
    });
  },

  /**
   * Preloads an image to check if it's accessible.
   */
  preloadImage (src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  },
};


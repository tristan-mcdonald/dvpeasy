import NFTCollectionPreview from './NFTCollectionPreview';
import Tooltip from './Tooltip';
import { Flow } from '../types/settlement';
import { tokenManager } from '../lib/token-manager';
import { logger } from '../lib/logger';
import { memo, useEffect, useMemo, useState } from 'react';
import { TokenLogoResolver } from './scaffold-eth/components/TokenLogoResolver';
import { TokensDisplayProps, TokenInfo } from '../types/components';
import { useChainId } from 'wagmi';
import { useTokenData } from '../hooks/useTokenData';

function TokensDisplay ({ flows }: TokensDisplayProps) {
  const chainId = useChainId();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);

  // Get token data from API.
  const { searchTokens } = useTokenData(chainId, 100);

  // Create a mapping of collection address to first NFT ID for preview.
  const getCollectionPreviews = (flows: Flow[]): Record<string, string> => {
    const collectionPreviews: Record<string, string> = {};

    // Filter to only NFT flows.
    const nftFlows = flows.filter(flow => flow.isNFT);

    // Group by token address and pick first NFT ID.
    nftFlows.forEach(flow => {
      const collectionAddress = flow.token.toLowerCase();

      // Only set if we haven't seen this collection yet.
      if (!collectionPreviews[collectionAddress]) {
        collectionPreviews[collectionAddress] = flow.amount; // For NFTs, amount is the token ID.
      }
    });

    return collectionPreviews;
  };

  const collectionPreviews = useMemo(() =>
    getCollectionPreviews(flows),
    [flows],
  );

  useEffect(() => {
    const loadTokenData = async () => {
      // Get unique token addresses from flows.
      const uniqueAddresses = Array.from(
        new Set(flows.map(flow => flow.token.toLowerCase())),
      );

      // Initialize tokens with loading state.
      const initialTokens: TokenInfo[] = uniqueAddresses.map(address => ({
        address,
        symbol: '',
        name: '',
        chainId,
        isLoading: true,
        isNFT: false,
      }));

      setTokens(initialTokens);

      // Fetch metadata for each token and try to find API data.
      const updatedTokens = await Promise.all(
        initialTokens.map(async (token) => {
          try {
            // First, get basic metadata.
            const metadata = await tokenManager.tokenMetadata(token.address);

            // Try to retrieve enriched data from API.
            const searchResults = searchTokens(token.address, { limit: 1 });
            const apiToken = searchResults?.tokens.find(apiTokenCandidate =>
              apiTokenCandidate.address.toLowerCase() === token.address.toLowerCase(),
            );

            return {
              ...token,
              symbol: metadata.symbol,
              name: apiToken?.name || metadata.symbol,
              isNFT: metadata.isNFT || false,
              isLoading: false,
              logoUrl: apiToken?.logoUrl,
              trustWalletLogoUrl: apiToken?.trustWalletLogoUrl,
            };
          } catch (error) {
            logger.warn(`Failed to get metadata for token ${token.address}:`, error);
            return {
              ...token,
              symbol: 'TOKEN',
              name: 'TOKEN',
              isNFT: false,
              isLoading: false,
            };
          }
        }),
      );

      setTokens(updatedTokens);
    };

    if (flows.length > 0) {
      loadTokenData();
    } else {
      setTokens([]);
    }
  }, [flows, chainId, searchTokens]);

  if (flows.length === 0) {
    return <span className="text-text-disabled text-sm">No tokens</span>;
  }

  const displayTokens = tokens.slice(0, 3);
  const remainingCount = tokens.length - 3;

  return (
    <div className="flex items-center gap-1">
      {displayTokens.map((token) => (
        <Tooltip
        content={token.isLoading ? 'Loading…' : token.symbol}
        key={token.address}>
          <button
          className="hover:opacity-75 transition-opacity"
          aria-label={token.symbol}
          type="button">
            {token.isNFT ? (
              <div className="size-5 rounded overflow-hidden">
                <NFTCollectionPreview
                className="size-5"
                size="thumbnail"
                tokenAddress={token.address}
                tokenId={collectionPreviews[token.address.toLowerCase()]}/>
              </div>
            ) : (
              <TokenLogoResolver
              size="sm"
              token={{
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                chainId: token.chainId,
                logoUrl: token.logoUrl,
                trustWalletLogoUrl: token.trustWalletLogoUrl,
              }}/>
            )}
          </button>
        </Tooltip>
      ))}
      {remainingCount > 0 && (
        <Tooltip content={`${remainingCount} more token${remainingCount !== 1 ? 's' : ''}`}>
          <span className="text-xs text-text-placeholder">+{remainingCount}</span>
        </Tooltip>
      )}
    </div>
  );
}

const MemoizedTokensDisplay = memo(TokensDisplay);
MemoizedTokensDisplay.displayName = 'TokensDisplay';

export default MemoizedTokensDisplay;

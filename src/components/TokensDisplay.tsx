import NFTCollectionPreview from './NFTCollectionPreview';
import Tooltip from './Tooltip';
import { Flow } from '../types/settlement';
import { flowDisplay } from '../lib/flow-display';
import { memo, useMemo } from 'react';
import { TokenLogoResolver } from './scaffold-eth/components/TokenLogoResolver';
import { useCurrentNetwork } from '../hooks/useCurrentNetwork';
import { useTokensForDisplay } from '../hooks/useTokensForDisplay';

interface TokensDisplayProps {
  flows: Flow[];
}

function TokensDisplay ({ flows }: TokensDisplayProps) {
  const { chainId } = useCurrentNetwork().network;
  const tokensForDisplay = useTokensForDisplay(flows.map(flow => flow.token));
  const tokens = Object.entries(tokensForDisplay).map(([address, token]) => ({ address, ...token }));

  const collectionPreviews = useMemo(() => flowDisplay.collectionPreviews(flows.map(flow => ({
    token: flow.token,
    nftId: flowDisplay.nftId(flow),
  }))), [flows]);

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
                chainId,
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

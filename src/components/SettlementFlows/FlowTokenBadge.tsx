import NFTCollectionPreview from '../NFTCollectionPreview';
import { Loader2 } from 'lucide-react';
import { TokenForDisplay } from '../../hooks/useTokensForDisplay';
import { TokenLogoResolver } from '../scaffold-eth/components/TokenLogoResolver';
import { useCurrentNetwork } from '../../hooks/useCurrentNetwork';

interface FlowTokenBadgeProps {
  className: string;
  token: string;
  tokenForDisplay: TokenForDisplay;
  collectionPreviewId: string;
}

/**
 * A flow's token at the head of its card: an NFT collection's preview or the token's logo, and
 * its symbol.
 */
export default function FlowTokenBadge ({
  className,
  token,
  tokenForDisplay,
  collectionPreviewId,
}: FlowTokenBadgeProps) {
  const { chainId } = useCurrentNetwork().network;

  return (
    <div className={className}>
      {tokenForDisplay.isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          {tokenForDisplay.isNFT ? (
            <div className="size-5 rounded border border-interface-border overflow-hidden">
              <NFTCollectionPreview
              className="size-5"
              size="thumbnail"
              tokenAddress={token}
              tokenId={collectionPreviewId} />
            </div>
          ) : (
            <TokenLogoResolver
            size="sm"
            token={{
              address: token,
              symbol: tokenForDisplay.symbol,
              name: tokenForDisplay.symbol,
              chainId,
              logoUrl: tokenForDisplay.logoUrl,
              trustWalletLogoUrl: tokenForDisplay.trustWalletLogoUrl,
            }}/>
          )}
          <span className="font-mono font-medium text-text-label">
            {tokenForDisplay.symbol}
            {tokenForDisplay.isNFT && ' (NFT)'}
          </span>
        </>
      )}
    </div>
  );
}

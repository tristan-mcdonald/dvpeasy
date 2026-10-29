import Address from '../scaffold-eth/Address';
import LabelWithIcon from '../LabelWithIcon';
import NFTCollectionPreview from '../NFTCollectionPreview';
import NFTIcon from '../NFTIcon';
import { ArrowDownRight, ArrowUpRight, Coins, Copy, Edit, ExternalLink, GripVertical, Hash, Loader2, Trash2, TriangleRight } from 'lucide-react';
import { FlowForDisplay } from '../../types/settlement';
import { TokenForDisplay } from '../../hooks/useTokensForDisplay';
import { TokenLogoResolver } from '../scaffold-eth/components/TokenLogoResolver';
import { useCurrentNetwork } from '../../hooks/useCurrentNetwork';

interface FlowDragOverlayProps {
  activeFlow: FlowForDisplay;
  tokensForDisplay?: Record<string, TokenForDisplay>;
  collectionPreviews: Record<string, string>;
}

/**
 * Overlay component shown while dragging a flow item.
 */
export default function FlowDragOverlay ({
  activeFlow,
  tokensForDisplay,
  collectionPreviews,
}: FlowDragOverlayProps) {
  const { chainId } = useCurrentNetwork().network;
  const tokenForDisplay = tokensForDisplay?.[activeFlow.token.toLowerCase()];
  const isNFT = activeFlow.nftId !== undefined;

  return (
    <div className="block w-full shadow-2xl rounded-lg bg-input-background border-2 border-primary p-4 relative z-50 drag-overlay">
      <div className="flex items-center justify-between mb-1 border-b border-interface-border pb-4">
        {tokenForDisplay && (
          <div className="flex items-center gap-2">
            {tokenForDisplay.isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {tokenForDisplay.isNFT ? (
                  <div className="size-5 rounded border border-interface-border overflow-hidden">
                    <NFTCollectionPreview
                      className="size-5"
                      size="thumbnail"
                      tokenAddress={activeFlow.token}
                      tokenId={collectionPreviews[activeFlow.token.toLowerCase()]}
                    />
                  </div>
                ) : (
                  <TokenLogoResolver
                    size="sm"
                    token={{
                      address: activeFlow.token,
                      symbol: tokenForDisplay.symbol,
                      name: tokenForDisplay.symbol,
                      chainId,
                      logoUrl: tokenForDisplay.logoUrl,
                      trustWalletLogoUrl: tokenForDisplay.trustWalletLogoUrl,
                    }}
                  />
                )}
                <span className="font-mono font-medium text-text-label">
                  {tokenForDisplay.symbol}
                  {tokenForDisplay.isNFT && ' (NFT)'}
                </span>
              </>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <div className="transition rounded bg-input-background border border-input-border p-2 text-text-label">
            <GripVertical className="size-4" />
          </div>
          <div className="transition rounded bg-input-background border border-input-border p-2 text-primary">
            <Edit className="size-4" />
          </div>
          <div className="transition rounded bg-input-background border border-input-border p-2 text-error">
            <Trash2 className="size-4" />
          </div>
        </div>
      </div>
      <div className="block w-full space-y-2 pt-4">
        <div className="space-y-1">
          <LabelWithIcon icon={<ArrowUpRight className="size-4" />}>From</LabelWithIcon>
          <Address
            address={activeFlow.from}
            showFull={false}
          />
        </div>
        <div className="space-y-1">
          <LabelWithIcon icon={<ArrowDownRight className="size-4" />}>To</LabelWithIcon>
          <Address
            address={activeFlow.to}
            showFull={false}
          />
        </div>
        <div className="space-y-1">
          <LabelWithIcon icon={<Coins className="size-4" />}>Token</LabelWithIcon>
          <Address
            address={activeFlow.token}
            showFull={false}
          />
        </div>
        <div className="space-y-1">
          <LabelWithIcon icon={isNFT ? <Hash className="size-4" /> : <TriangleRight className="size-4" />}>
            {isNFT ? 'NFT ID' : 'Amount'}
          </LabelWithIcon>
          {isNFT ? (
            <div className="flex flex-auto items-center justify-between gap-2 w-full font-mono">
              <span className="wrap-anywhere">{activeFlow.amount}</span>
              <div className="flex items-center gap-1">
                <div className="transition-colors p-1 text-primary">
                  <NFTIcon
                    className="transition-colors"
                    size="sm"
                  />
                </div>
                <div className="transition-colors p-1 text-primary">
                  <Copy className="transition-colors size-4" />
                </div>
                <div className="transition-colors p-1 text-primary">
                  <ExternalLink className="transition-colors size-4" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono">{activeFlow.amount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import Address from './scaffold-eth/Address';
import LabelWithIcon from './LabelWithIcon';
import NFTCollectionPreview from './NFTCollectionPreview';
import NFTIcon from './NFTIcon';
import { ArrowDownRight, ArrowUpRight, Coins, Copy, Edit, ExternalLink, GripVertical, Hash, Loader2, Trash2, TriangleRight } from 'lucide-react';
import { Flow } from '../types/settlement';
import { TokenLogoResolver } from './scaffold-eth/components/TokenLogoResolver';
import { WalletClient } from 'viem';

interface TokenMetadata {
  symbol: string;
  isLoading: boolean;
  isNFT: boolean;
  trustWalletLogoUrl?: string;
  logoUrl?: string;
}

interface FlowDragOverlayProps {
  activeFlow: Flow;
  tokenMetadata?: Record<string, TokenMetadata>;
  walletClient?: WalletClient;
  collectionPreviews: Record<string, string>;
}

/**
 * Overlay component shown while dragging a flow item.
 */
export default function FlowDragOverlay ({
  activeFlow,
  tokenMetadata,
  walletClient,
  collectionPreviews,
}: FlowDragOverlayProps) {
  return (
    <div className="block w-full shadow-2xl rounded-lg bg-input-background border-2 border-primary p-4 relative z-50 drag-overlay">
      <div className="flex items-center justify-between mb-1 border-b border-interface-border pb-4">
        {tokenMetadata && tokenMetadata[activeFlow.token.toLowerCase()] && (
          <div className="flex items-center gap-2">
            {tokenMetadata[activeFlow.token.toLowerCase()].isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {tokenMetadata[activeFlow.token.toLowerCase()].isNFT ? (
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
                      symbol: tokenMetadata[activeFlow.token.toLowerCase()].symbol,
                      name: tokenMetadata[activeFlow.token.toLowerCase()].symbol,
                      chainId: walletClient?.chain?.id || 11155111,
                      logoUrl: tokenMetadata[activeFlow.token.toLowerCase()].logoUrl,
                      trustWalletLogoUrl: tokenMetadata[activeFlow.token.toLowerCase()].trustWalletLogoUrl,
                    }}
                  />
                )}
                <span className="font-mono font-medium text-text-label">
                  {tokenMetadata[activeFlow.token.toLowerCase()].symbol}
                  {tokenMetadata[activeFlow.token.toLowerCase()].isNFT && ' (NFT)'}
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
          <LabelWithIcon icon={activeFlow.isNFT ? <Hash className="size-4" /> : <TriangleRight className="size-4" />}>
            {activeFlow.isNFT ? 'NFT ID' : 'Amount'}
          </LabelWithIcon>
          {activeFlow.isNFT ? (
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

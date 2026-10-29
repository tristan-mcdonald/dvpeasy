import Address from '../scaffold-eth/Address';
import ErrorBoundary from '../ErrorBoundary';
import FlowDragOverlay from './FlowDragOverlay';
import HeadingAndTotal from '../HeadingAndTotal';
import LabelWithIcon from '../LabelWithIcon';
import NFTCollectionPreview from '../NFTCollectionPreview';
import NFTIcon from '../NFTIcon';
import NFTModal from '../NFTModal';
import Tooltip from '../Tooltip';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowDownRight, ArrowUpRight, Check, Coins, Copy, Edit, ExternalLink, GripVertical, Hash, Loader2, Plus, Trash2, TriangleRight } from 'lucide-react';
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { flowDisplay } from '../../lib/flow-display';
import { FlowForDisplay } from '../../types/settlement';
import { networkLinks } from '../../lib/network-links';
import { TokenForDisplay } from '../../hooks/useTokensForDisplay';
import { TokenLogoResolver } from '../scaffold-eth/components/TokenLogoResolver';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useCurrentNetwork } from '../../hooks/useCurrentNetwork';
import { useMemo, useState, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';

interface SettlementFlowsProps {
  flows: FlowForDisplay[];
  tokensForDisplay?: Record<string, TokenForDisplay>;
  isEditMode?: boolean;
  onEditFlow?: (index: number) => void;
  onRemoveFlow?: (index: number) => void;
  onReorderFlows?: (oldIndex: number, newIndex: number) => void;
  onAddFlow?: () => void;
}

// Individual sortable flow item component.
interface SortableFlowItemProps {
  flow: FlowForDisplay;
  index: number;
  isEditMode: boolean;
  tokensForDisplay?: Record<string, TokenForDisplay>;
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
  copiedNftId: string | null;
  onCopyNftId: (nftId: string) => void;
  onShowNft: (flow: FlowForDisplay) => void;
  collectionPreviews: Record<string, string>;
}

const SortableFlowItem = memo(function SortableFlowItem ({
  flow,
  index,
  isEditMode,
  tokensForDisplay,
  onEdit,
  onRemove,
  copiedNftId,
  onCopyNftId,
  onShowNft,
  collectionPreviews,
}: SortableFlowItemProps) {
  const { network } = useCurrentNetwork();
  const flowId = `flow-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flowId, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const { token, from, to, amount, nftId } = flow;
  const isNFT = nftId !== undefined;
  const tokenForDisplay = tokensForDisplay?.[token.toLowerCase()];

  return (
    <li
    className={`block w-full shadow-standard rounded-lg bg-input-background border border-input-border p-4 relative sortable-item ${isDragging ? 'is-dragging' : ''}`}
    ref={setNodeRef}
    style={style}>
      {isEditMode ? (
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
                      tokenAddress={token}
                      tokenId={collectionPreviews[token.toLowerCase()]} />
                    </div>
                  ) : (
                    <TokenLogoResolver
                    size="sm"
                    token={{
                      address: token,
                      symbol: tokenForDisplay.symbol,
                      name: tokenForDisplay.symbol,
                      chainId: network.chainId,
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
          )}
          <div className="flex gap-2">
            <Tooltip content="Drag to reorder">
              <button
              className="transition cursor-grab active:cursor-grabbing rounded bg-input-background border border-input-border hover:border-input-border-focus focus:border-input-border-focus focus:ring-4 focus:ring-input-outline-focus focus:outline-none p-2 text-text-label hover:bg-input-background"
              {...attributes}
              {...listeners}
              type="button">
                <GripVertical className="size-4" />
              </button>
            </Tooltip>
            <Tooltip content="Edit flow">
              <button
              className="transition cursor-pointer rounded bg-input-background border border-input-border hover:border-input-border-focus focus:border-input-border-focus focus:ring-4 focus:ring-input-outline-focus focus:outline-none p-2 text-primary hover:text-primary-interaction"
              onClick={() => onEdit && onEdit(index)}
              type="button">
                <Edit className="size-4" />
              </button>
            </Tooltip>
            <Tooltip content="Remove flow">
              <button
              className="transition cursor-pointer rounded bg-input-background border border-input-border hover:border-input-border-focus focus:border-input-border-focus focus:ring-4 focus:ring-input-outline-focus focus:outline-none p-2 text-error"
              onClick={() => onRemove && onRemove(index)}
              type="button">
                <Trash2 className="size-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      ) : (
        // View mode: Token info centered with bottom border (settlement details page).
        tokenForDisplay && (
          <div className="flex items-center justify-center gap-2 border-b border-interface-border pb-4">
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
                    tokenId={collectionPreviews[token.toLowerCase()]} />
                  </div>
                ) : (
                  <TokenLogoResolver
                  size="sm"
                  token={{
                    address: token,
                    symbol: tokenForDisplay.symbol,
                    name: tokenForDisplay.symbol,
                    chainId: network.chainId,
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
        )
      )}

      <div className="block w-full space-y-2 pt-4">
        <div className="space-y-1">
          <LabelWithIcon icon={<ArrowUpRight className="size-4" />}>From</LabelWithIcon>
          <Address
          address={from}
          showFull={false} />
        </div>
        <div className="space-y-1">
          <LabelWithIcon icon={<ArrowDownRight className="size-4" />}>To</LabelWithIcon>
          <Address
          address={to}
          showFull={false} />
        </div>
        <div className="space-y-1">
          <LabelWithIcon icon={<Coins className="size-4" />}>Token</LabelWithIcon>
          <Address
          address={token}
          showFull={false} />
        </div>
        <div className="space-y-1">
          <LabelWithIcon icon={isNFT ? <Hash className="size-4" /> : <TriangleRight className="size-4" />}>
            {isNFT ? 'NFT ID' : 'Amount'}
          </LabelWithIcon>
          {nftId !== undefined ? (
            <div className="flex flex-auto items-center justify-between gap-2 w-full font-mono">
              <span className="wrap-anywhere">{amount}</span>
              <div className="flex items-center gap-1">
                <Tooltip content="View NFT preview">
                  <button
                  className="cursor-pointer transition-colors p-1 text-primary hover:text-primary-interaction"
                  onClick={() => onShowNft(flow)}
                  type="button">
                    <NFTIcon
                    className="transition-colors"
                    size="sm" />
                  </button>
                </Tooltip>
                <Tooltip content="Copy NFT ID">
                  <button
                  className="cursor-pointer transition-colors p-1 text-primary hover:text-primary-interaction"
                  onClick={() => onCopyNftId(nftId)}
                  type="button">
                    {copiedNftId === nftId ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <Copy className="transition-colors size-4" />
                    )}
                  </button>
                </Tooltip>
                {(() => {
                  const nftMarketplaceUrl = networkLinks.nft(network.chainId, token, nftId);
                  return nftMarketplaceUrl && !network.isTestnet && (
                    <Tooltip content="View on NFT marketplace">
                      <a
                      href={nftMarketplaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer transition-colors p-1 text-primary hover:text-primary-interaction">
                        <ExternalLink className="transition-colors size-4" />
                      </a>
                    </Tooltip>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono">{amount}</span>
            </div>
          )}
        </div>
      </div>
    </li>
  );
});

export default function SettlementFlows ({
  flows,
  tokensForDisplay,
  isEditMode = false,
  onEditFlow,
  onRemoveFlow,
  onReorderFlows,
  onAddFlow,
}: SettlementFlowsProps) {

  const { copiedText: copiedNftId, copy: copyNftId } = useCopyToClipboard();
  const [nftFlowShown, setNftFlowShown] = useState<FlowForDisplay | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Drag and drop sensors.
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag start event.
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  // Handle drag end event.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && onReorderFlows) {
      const oldIndex = flows.findIndex((_, index) => `flow-${index}` === active.id);
      const newIndex = flows.findIndex((_, index) => `flow-${index}` === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) onReorderFlows(oldIndex, newIndex);
    }

    setActiveId(null);
  };

  // Get the active flow being dragged for the overlay.
  const activeFlow = useMemo(() => {
    if (!activeId) return null;
    const index = parseInt(activeId.replace('flow-', ''));
    return flows[index] || null;
  }, [activeId, flows]);

  const flowCount = flows.length;
  const collectionPreviews = useMemo(() => flowDisplay.collectionPreviews(flows), [flows]);

  // Handle case when no flows and no add function is provided (read-only mode).
  if (flowCount === 0 && !onAddFlow) {
    return (
      <span className="block py-2 text-center text-text-label">No flows found for this settlement.</span>
    );
  }

  const flowItems = flows.map((flow, index) => (
    <ErrorBoundary
    description="There was an error displaying this flow item. Other flows are still visible."
    fallback={
      <div className="block w-full shadow-standard rounded-lg bg-input-background border border-input-border p-4">
        <p className="text-error text-sm">Error loading flow item #{index + 1}</p>
      </div>
    }
    key={`flow-error-boundary-${index}`}
    title="Flow item error">
      <SortableFlowItem
      collectionPreviews={collectionPreviews}
      copiedNftId={copiedNftId}
      flow={flow}
      index={index}
      isEditMode={isEditMode}
      key={`flow-${index}`}
      onCopyNftId={copyNftId}
      onEdit={onEditFlow}
      onRemove={onRemoveFlow}
      onShowNft={setNftFlowShown}
      tokensForDisplay={tokensForDisplay} />
    </ErrorBoundary>
  ));

  return (
    <div className="space-y-3">
      {isEditMode ? (
        // Show flows with drag & drop and add button.
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
          <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          sensors={sensors}>
            <SortableContext
            items={flows.map((_, index) => `flow-${index}`)}
            strategy={verticalListSortingStrategy}>
              {flowItems}
            </SortableContext>
            <DragOverlay>
              {activeFlow && (
                <FlowDragOverlay
                activeFlow={activeFlow}
                collectionPreviews={collectionPreviews}
                tokensForDisplay={tokensForDisplay} />
              )}
            </DragOverlay>
          </DndContext>
          {onAddFlow && (
            <li {...(flowCount === 0 && { className: 'sm:col-span-2 lg:col-span-1 lg:col-start-2 flex justify-center' })}>
              <button
              className="transition-colors relative flex flex-col items-center justify-center gap-2 h-full w-full sm:max-w-sm lg:max-w-none shadow-standard rounded-lg border-[3px] border-dashed border-primary-subtle hover:border-primary bg-card-background hover:bg-white py-[8rem] lg:py-[8.1rem] px-4 text-primary"
              onClick={onAddFlow}
              type="button">
                <Plus className="size-6" />
                <span className="font-medium">Add token flow</span>
              </button>
            </li>
          )}
        </ul>
      ) : (
        // Show flows only.
        <>
          {flowCount > 0 && (
            <HeadingAndTotal
            count={flowCount}
            heading="Settlement flows"
            singularName="flow" />
          )}
          <ul
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-testid="settlement-flows-list">
            {flowItems}
          </ul>
        </>
      )}

      <NFTModal
      flow={nftFlowShown}
      onClose={() => setNftFlowShown(null)} />
    </div>
  );
}

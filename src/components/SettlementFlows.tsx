import Address from './scaffold-eth/Address';
import ErrorBoundary from './ErrorBoundary';
import FlowDragOverlay from './FlowDragOverlay';
import HeadingAndTotal from './HeadingAndTotal';
import LabelWithIcon from './LabelWithIcon';
import NFTCollectionPreview from './NFTCollectionPreview';
import NFTIcon from './NFTIcon';
import NFTModal from './NFTModal';
import Tooltip from './Tooltip';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowDownRight, ArrowUpRight, Check, Coins, Copy, Edit, ExternalLink, GripVertical, Hash, Loader2, Plus, Trash2, TriangleRight } from 'lucide-react';
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { flowsManager } from '../lib/flow-utils';
import { CSS } from '@dnd-kit/utilities';
import { Flow } from '../types/settlement';
import { chainManager } from '../lib/chain-manager';
import { TokenLogoResolver } from './scaffold-eth/components/TokenLogoResolver';
import { useMemo, useState, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { WalletClient } from 'viem';

interface FormattedFlow {
  token: string;
  isNFT: boolean;
  from: string;
  to: string;
  amountOrId: bigint;
  formattedAmount: string;
}

interface TokenMetadata {
  symbol: string;
  isLoading: boolean;
  isNFT: boolean;
  trustWalletLogoUrl?: string;
  logoUrl?: string;
}

interface SettlementFlowsProps {
  formattedFlows?: FormattedFlow[];
  flows?: Flow[];
  tokenMetadata?: Record<string, TokenMetadata>;
  walletClient?: WalletClient;
  isEditMode?: boolean;
  onEditFlow?: (index: number) => void;
  onRemoveFlow?: (index: number) => void;
  onReorderFlows?: (flows: Flow[]) => void;
  onAddFlow?: () => void;
}

// Individual sortable flow item component.
interface SortableFlowItemProps {
  flow: Flow | FormattedFlow;
  index: number;
  isEditMode: boolean;
  tokenMetadata?: Record<string, TokenMetadata>;
  walletClient?: WalletClient;
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
  copiedNftId: string | null;
  setCopiedNftId: (id: string | null) => void;
  setShowNftModal: (modal: string | null) => void;
  collectionPreviews: Record<string, string>;
}

const SortableFlowItem = memo(function SortableFlowItem ({
  flow,
  index,
  isEditMode,
  tokenMetadata,
  walletClient,
  onEdit,
  onRemove,
  copiedNftId,
  setCopiedNftId,
  setShowNftModal,
  collectionPreviews,
}: SortableFlowItemProps) {
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

  // Handle different flow types.
  const isFormattedFlow = 'amountOrId' in flow;
  const token = flow.token;
  const from = flow.from;
  const to = flow.to;
  const isNFT = flow.isNFT;
  const amount = isFormattedFlow ? flow.formattedAmount : flow.amount;

  // Safe BigInt conversion to avoid syntax errors.
  const amountOrId = isFormattedFlow ? flow.amountOrId : flowsManager.safeAmountToBigInt(flow.amount);

  const copyNftIdToClipboard = async (nftId: string) => {
    const success = await flowsManager.copyToClipboard(nftId);
    if (success) {
      setCopiedNftId(nftId);
      setTimeout(() => setCopiedNftId(null), 2000);
    }
  };

  return (
    <li
    className={`block w-full shadow-standard rounded-lg bg-input-background border border-input-border p-4 relative sortable-item ${isDragging ? 'is-dragging' : ''}`}
    ref={setNodeRef}
    style={style}>
      {isEditMode ? (
        <div className="flex items-center justify-between mb-1 border-b border-interface-border pb-4">
          {tokenMetadata && tokenMetadata[token.toLowerCase()] && (
            <div className="flex items-center gap-2">
              {tokenMetadata[token.toLowerCase()].isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  {tokenMetadata[token.toLowerCase()].isNFT ? (
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
                      symbol: tokenMetadata[token.toLowerCase()].symbol,
                      name: tokenMetadata[token.toLowerCase()].symbol,
                      chainId: walletClient?.chain?.id || 11155111,
                      logoUrl: tokenMetadata[token.toLowerCase()].logoUrl,
                      trustWalletLogoUrl: tokenMetadata[token.toLowerCase()].trustWalletLogoUrl,
                    }}/>
                  )}
                  <span className="font-mono font-medium text-text-label">
                    {tokenMetadata[token.toLowerCase()].symbol}
                    {tokenMetadata[token.toLowerCase()].isNFT && ' (NFT)'}
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
        tokenMetadata && tokenMetadata[token.toLowerCase()] && (
          <div className="flex items-center justify-center gap-2 border-b border-interface-border pb-4">
            {tokenMetadata[token.toLowerCase()].isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {tokenMetadata[token.toLowerCase()].isNFT ? (
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
                    symbol: tokenMetadata[token.toLowerCase()].symbol,
                    name: tokenMetadata[token.toLowerCase()].symbol,
                    chainId: walletClient?.chain?.id || 11155111,
                    logoUrl: tokenMetadata[token.toLowerCase()].logoUrl,
                    trustWalletLogoUrl: tokenMetadata[token.toLowerCase()].trustWalletLogoUrl,
                  }}/>
                )}
                <span className="font-mono font-medium text-text-label">
                  {tokenMetadata[token.toLowerCase()].symbol}
                  {tokenMetadata[token.toLowerCase()].isNFT && ' (NFT)'}
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
          {isNFT ? (
            <div className="flex flex-auto items-center justify-between gap-2 w-full font-mono">
              <span className="wrap-anywhere">{amount}</span>
              <div className="flex items-center gap-1">
                <Tooltip content="View NFT preview">
                  <button
                  className="cursor-pointer transition-colors p-1 text-primary hover:text-primary-interaction"
                  onClick={() => setShowNftModal(`${token}-${amountOrId.toString()}`)}
                  type="button">
                    <NFTIcon
                    className="transition-colors"
                    size="sm" />
                  </button>
                </Tooltip>
                <Tooltip content="Copy NFT ID">
                  <button
                  className="cursor-pointer transition-colors p-1 text-primary hover:text-primary-interaction"
                  onClick={() => copyNftIdToClipboard(amount)}
                  type="button">
                    {copiedNftId === amount ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <Copy className="transition-colors size-4" />
                    )}
                  </button>
                </Tooltip>
                {(() => {
                  const chainId = walletClient?.chain?.id || 11155111;
                  const nftMarketplaceUrl = chainManager.nftMarketplaceUrl(chainId, token, amountOrId.toString());
                  return nftMarketplaceUrl && !chainManager.isTestnetChain(chainId) && (
                    <Tooltip content="View on NFT marketplace">
                      <a
                      href={nftMarketplaceUrl}
                      target="_blank"
                      rel="noopener,noreferrer"
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
  formattedFlows,
  flows,
  tokenMetadata,
  walletClient,
  isEditMode = false,
  onEditFlow,
  onRemoveFlow,
  onReorderFlows,
  onAddFlow,
}: SettlementFlowsProps) {

  const [copiedNftId, setCopiedNftId] = useState<string | null>(null);
  const [showNftModal, setShowNftModal] = useState<string | null>(null);
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

    if (active.id !== over?.id && flows && onReorderFlows) {
      const oldIndex = flows.findIndex((_, index) => `flow-${index}` === active.id);
      const newIndex = flows.findIndex((_, index) => `flow-${index}` === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFlows = arrayMove(flows, oldIndex, newIndex);
        onReorderFlows(reorderedFlows);
      }
    }

    setActiveId(null);
  };

  // Get the active flow being dragged for the overlay.
  const activeFlow = useMemo(() => {
    if (!activeId || !flows) return null;
    const index = parseInt(activeId.replace('flow-', ''));
    return flows[index] || null;
  }, [activeId, flows]);


  // Use either formattedFlows or flows based on what's provided.
  const displayFlows = useMemo(() => formattedFlows || flows || [], [formattedFlows, flows]);
  const flowCount = displayFlows.length;

  const collectionPreviews = useMemo(() =>
    flowsManager.getCollectionPreviews(displayFlows),
    [displayFlows],
  );

  // Handle case when no flows and no add function is provided (read-only mode).
  if (flowCount === 0 && !onAddFlow) {
    return (
      <span className="block py-2 text-center text-text-label">No flows found for this settlement.</span>
    );
  }

  const flowItems = displayFlows.map((flow, index) => (
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
      onEdit={onEditFlow}
      onRemove={onRemoveFlow}
      setCopiedNftId={setCopiedNftId}
      setShowNftModal={setShowNftModal}
      tokenMetadata={tokenMetadata}
      walletClient={walletClient} />
    </ErrorBoundary>
  ));

  return (
    <div className="space-y-3">
      {isEditMode && flows ? (
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
                tokenMetadata={tokenMetadata}
                walletClient={walletClient} />
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
      displayFlows={displayFlows}
      setShowNftModal={setShowNftModal}
      showNftModal={showNftModal} />
    </div>
  );
}

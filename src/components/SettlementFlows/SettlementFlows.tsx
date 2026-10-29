import ErrorBoundary from '../ErrorBoundary';
import FlowCard from './FlowCard';
import FlowDragOverlay from './FlowDragOverlay';
import HeadingAndTotal from '../HeadingAndTotal';
import NFTModal from '../NFTModal';
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { flowDisplay } from '../../lib/flow-display';
import { FlowForDisplay } from '../../types/settlement';
import { Plus } from 'lucide-react';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TokenForDisplay } from '../../hooks/useTokensForDisplay';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useMemo, useState } from 'react';

interface SettlementFlowsProps {
  flows: FlowForDisplay[];
  tokensForDisplay?: Record<string, TokenForDisplay>;
  isEditMode?: boolean;
  onEditFlow?: (index: number) => void;
  onRemoveFlow?: (index: number) => void;
  onReorderFlows?: (oldIndex: number, newIndex: number) => void;
  onAddFlow?: () => void;
}

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
      <FlowCard
      collectionPreviewId={collectionPreviews[flow.token.toLowerCase()]}
      copiedNftId={copiedNftId}
      flow={flow}
      index={index}
      isEditMode={isEditMode}
      onCopyNftId={copyNftId}
      onEdit={onEditFlow}
      onRemove={onRemoveFlow}
      onShowNft={setNftFlowShown}
      tokenForDisplay={tokensForDisplay?.[flow.token.toLowerCase()]} />
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
                collectionPreviewId={collectionPreviews[activeFlow.token.toLowerCase()]}
                tokenForDisplay={tokensForDisplay?.[activeFlow.token.toLowerCase()]} />
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

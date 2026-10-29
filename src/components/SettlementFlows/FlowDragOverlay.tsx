import FlowDetails from './FlowDetails';
import FlowTokenBadge from './FlowTokenBadge';
import NFTIcon from '../NFTIcon';
import { Copy, Edit, ExternalLink, GripVertical, Trash2 } from 'lucide-react';
import { FlowForDisplay } from '../../types/settlement';
import { TokenForDisplay } from '../../hooks/useTokensForDisplay';

interface FlowDragOverlayProps {
  activeFlow: FlowForDisplay;
  tokenForDisplay?: TokenForDisplay;
  collectionPreviewId: string;
}

/**
 * A copy of the flow's card which follows the pointer while it's dragged, with its buttons drawn
 * as plain icons.
 */
export default function FlowDragOverlay ({
  activeFlow,
  tokenForDisplay,
  collectionPreviewId,
}: FlowDragOverlayProps) {
  return (
    <div className="block w-full shadow-2xl rounded-lg bg-input-background border-2 border-primary p-4 relative z-50 drag-overlay">
      <div className="flex items-center justify-between mb-1 border-b border-interface-border pb-4">
        {tokenForDisplay && (
          <FlowTokenBadge
          className="flex items-center gap-2"
          collectionPreviewId={collectionPreviewId}
          token={activeFlow.token}
          tokenForDisplay={tokenForDisplay} />
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
      <FlowDetails
      flow={activeFlow}
      nftActions={(
        <>
          <div className="transition-colors p-1 text-primary">
            <NFTIcon
            className="transition-colors"
            size="sm" />
          </div>
          <div className="transition-colors p-1 text-primary">
            <Copy className="transition-colors size-4" />
          </div>
          <div className="transition-colors p-1 text-primary">
            <ExternalLink className="transition-colors size-4" />
          </div>
        </>
      )} />
    </div>
  );
}

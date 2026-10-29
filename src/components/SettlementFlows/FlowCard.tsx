import FlowDetails from './FlowDetails';
import FlowTokenBadge from './FlowTokenBadge';
import NFTIcon from '../NFTIcon';
import Tooltip from '../Tooltip';
import { Check, Copy, Edit, ExternalLink, GripVertical, Trash2 } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import { FlowForDisplay } from '../../types/settlement';
import { flowSortId } from './flowSortId';
import { memo } from 'react';
import { networkLinks } from '../../lib/network-links';
import { TokenForDisplay } from '../../hooks/useTokensForDisplay';
import { useCurrentNetwork } from '../../hooks/useCurrentNetwork';
import { useSortable } from '@dnd-kit/sortable';

const cardButtonClass = 'transition rounded bg-input-background border border-input-border hover:border-input-border-focus focus:border-input-border-focus focus:ring-4 focus:ring-input-outline-focus focus:outline-none p-2';
const nftActionClass = 'cursor-pointer transition-colors p-1 text-primary hover:text-primary-interaction';

interface FlowCardProps {
  flow: FlowForDisplay;
  index: number;
  isEditMode: boolean;
  tokenForDisplay?: TokenForDisplay;
  collectionPreviewId: string;
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
  copiedNftId: string | null;
  onCopyNftId: (nftId: string) => void;
  onShowNft: (flow: FlowForDisplay) => void;
}

/**
 * A flow's card. In edit mode it can be dragged to reorder the flows, edited or removed.
 */
const FlowCard = memo(function FlowCard ({
  flow,
  index,
  isEditMode,
  tokenForDisplay,
  collectionPreviewId,
  onEdit,
  onRemove,
  copiedNftId,
  onCopyNftId,
  onShowNft,
}: FlowCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flowSortId(index), disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <li
    className={`block w-full shadow-standard rounded-lg bg-input-background border border-input-border p-4 relative sortable-item ${isDragging ? 'is-dragging' : ''}`}
    ref={setNodeRef}
    style={style}>
      {isEditMode ? (
        <div className="flex items-center justify-between mb-1 border-b border-interface-border pb-4">
          {tokenForDisplay && (
            <FlowTokenBadge
            className="flex items-center gap-2"
            collectionPreviewId={collectionPreviewId}
            token={flow.token}
            tokenForDisplay={tokenForDisplay} />
          )}
          <div className="flex gap-2">
            <Tooltip content="Drag to reorder">
              <button
              className={`${cardButtonClass} cursor-grab active:cursor-grabbing text-text-label hover:bg-input-background`}
              {...attributes}
              {...listeners}
              type="button">
                <GripVertical className="size-4" />
              </button>
            </Tooltip>
            <Tooltip content="Edit flow">
              <button
              className={`${cardButtonClass} cursor-pointer text-primary hover:text-primary-interaction`}
              onClick={() => onEdit?.(index)}
              type="button">
                <Edit className="size-4" />
              </button>
            </Tooltip>
            <Tooltip content="Remove flow">
              <button
              className={`${cardButtonClass} cursor-pointer text-error`}
              onClick={() => onRemove?.(index)}
              type="button">
                <Trash2 className="size-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      ) : (
        tokenForDisplay && (
          <FlowTokenBadge
          className="flex items-center justify-center gap-2 border-b border-interface-border pb-4"
          collectionPreviewId={collectionPreviewId}
          token={flow.token}
          tokenForDisplay={tokenForDisplay} />
        )
      )}

      <FlowDetails
      flow={flow}
      nftActions={(
        <NftActions
        copiedNftId={copiedNftId}
        flow={flow}
        onCopyNftId={onCopyNftId}
        onShowNft={onShowNft} />
      )} />
    </li>
  );
});

export default FlowCard;

type NftActionsProps = Pick<FlowCardProps, 'flow' | 'copiedNftId' | 'onCopyNftId' | 'onShowNft'>;

function NftActions ({ flow, copiedNftId, onCopyNftId, onShowNft }: NftActionsProps) {
  const { chainId } = useCurrentNetwork().network;
  if (flow.nftId === undefined) return null;

  const { nftId } = flow;
  const nftMarketplaceUrl = networkLinks.nft(chainId, flow.token, nftId);

  return (
    <>
      <Tooltip content="View NFT preview">
        <button
        className={nftActionClass}
        onClick={() => onShowNft(flow)}
        type="button">
          <NFTIcon
          className="transition-colors"
          size="sm" />
        </button>
      </Tooltip>
      <Tooltip content="Copy NFT ID">
        <button
        className={nftActionClass}
        onClick={() => onCopyNftId(nftId)}
        type="button">
          {copiedNftId === nftId ? (
            <Check className="size-4 text-success" />
          ) : (
            <Copy className="transition-colors size-4" />
          )}
        </button>
      </Tooltip>
      {nftMarketplaceUrl && (
        <Tooltip content="View on NFT marketplace">
          <a
          className={nftActionClass}
          href={nftMarketplaceUrl}
          rel="noopener noreferrer"
          target="_blank">
            <ExternalLink className="transition-colors size-4" />
          </a>
        </Tooltip>
      )}
    </>
  );
}

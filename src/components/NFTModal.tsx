import NFTImage from './NFTImage';
import { FlowForDisplay } from '../types/settlement';
import { X } from 'lucide-react';

interface NFTModalProps {
  flow: FlowForDisplay | null;
  onClose: () => void;
}

/**
 * A larger view of a flow's NFT image, over the page.
 */
export default function NFTModal ({ flow, onClose }: NFTModalProps) {
  if (flow?.nftId === undefined) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}>
      <div
        className="bg-card-background border border-interface-border rounded-lg p-6 max-w-md mx-4"
        onClick={(event) => event.stopPropagation()}>
        <div className="space-y-6">
          <div className="flex flex-row justify-end items-center">
            <button
              className="transition-colors cursor-pointer text-primary hover:text-primary-interaction"
              aria-label="Close"
              onClick={onClose}>
              <X />
            </button>
          </div>
          <NFTImage
            showTokenId={true}
            size="large"
            tokenAddress={flow.token}
            tokenId={flow.nftId}
          />
        </div>
      </div>
    </div>
  );
}

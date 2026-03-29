import NFTImage from './NFTImage';
import { Flow } from '../types/settlement';
import { X } from 'lucide-react';

interface FormattedFlow {
  token: string;
  isNFT: boolean;
  from: string;
  to: string;
  amountOrId: bigint;
  formattedAmount: string;
}

interface NFTModalProps {
  showNftModal: string | null;
  setShowNftModal: (modal: string | null) => void;
  displayFlows: (FormattedFlow | Flow)[];
}

/**
 * Modal component for displaying NFT images in a fullscreen overlay.
 */
export default function NFTModal ({
  showNftModal,
  setShowNftModal,
  displayFlows,
}: NFTModalProps) {
  if (!showNftModal) return null;

  const modalFlow = displayFlows.find((flow: FormattedFlow | Flow) => {
    const tokenId = 'amountOrId' in flow ? flow.amountOrId.toString() : flow.amount;
    return `${flow.token}-${tokenId}` === showNftModal;
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setShowNftModal(null)}>
      <div
        className="bg-card-background border border-interface-border rounded-lg p-6 max-w-md mx-4"
        onClick={(event) => event.stopPropagation()}>
        <div className="space-y-6">
          <div className="flex flex-row justify-end items-center">
            <button
              className="transition-colors cursor-pointer text-primary hover:text-primary-interaction"
              aria-label="Close"
              onClick={() => setShowNftModal(null)}>
              <X />
            </button>
          </div>
          {modalFlow && (
            <NFTImage
              showTokenId={true}
              size="large"
              tokenAddress={modalFlow.token}
              tokenId={'amountOrId' in modalFlow ? modalFlow.amountOrId.toString() : modalFlow.amount}
            />
          )}
        </div>
      </div>
    </div>
  );
}

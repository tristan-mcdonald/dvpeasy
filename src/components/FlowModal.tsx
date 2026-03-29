import ButtonLink from './ButtonLink';
import { Check, X, Save } from 'lucide-react';
import { Flow } from '../types/settlement';
import { FlowInput } from './scaffold-eth/FlowInput';
import { MouseEvent, useEffect, useState } from 'react';

interface FlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flow: Flow) => void;
  flow?: Flow;
  title?: string;
}

const EMPTY_FLOW: Flow = {
  token: '',
  from: '',
  to: '',
  amount: '',
  isNFT: false,
};

export default function FlowModal ({ isOpen, onClose, onSave, flow, title = 'Add token flow' }: FlowModalProps) {
  const [currentFlow, setCurrentFlow] = useState<Flow>(flow || EMPTY_FLOW);
  const [isFormValid, setIsFormValid] = useState(false);

  // Handle escape key and prevent body scroll when modal is open.
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset form when modal opens/closes or flow changes.
  useEffect(() => {
    if (isOpen) {
      setCurrentFlow(flow || EMPTY_FLOW);
      setIsFormValid(false);
    }
  }, [isOpen, flow]);

  // Event handlers.
  const handleSave = () => {
    if (isFormValid) {
      onSave(currentFlow);
      onClose();
    }
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={handleBackdropClick}>
      <div
      className="shadow-standard border border-interface-border rounded-lg min-h-124 max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-body-background p-6"
      onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
          className="transition-colors cursor-pointer text-primary hover:text-primary-interaction p-1"
          aria-label="Close"
          onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="shadow-standard rounded-lg w-full border border-interface-border bg-card-background p-4">
          <FlowInput
          flow={currentFlow}
          onChange={setCurrentFlow}
          onValidationChange={setIsFormValid} />

          <div className="mt-6 flex justify-end">
            <ButtonLink
            as="button"
            disabled={!isFormValid}
            icon={flow ? <Save className="size-4" /> : <Check className="size-4" />}
            onClick={handleSave}
            type="button"
            variant={!isFormValid ? 'secondary' : 'primary'}>
              {flow ? 'Update flow' : 'Add flow'}
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}

import ButtonLink from '../ButtonLink';
import { Check, Loader2 } from 'lucide-react';

interface CreateSettlementActionsProps {
  isLoading: boolean;
  onSubmit: () => void;
}

export default function CreateSettlementActions ({ isLoading, onSubmit }: CreateSettlementActionsProps) {
  return (
    <div className="mt-8 mx-auto max-w-5xl">
      <ButtonLink
      as="button"
      disabled={isLoading}
      fullWidth
      icon={isLoading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-5" />}
      onClick={onSubmit}
      size="lg"
      type="submit">
        {isLoading ? 'Creating settlement…' : 'Create settlement'}
      </ButtonLink>
    </div>
  );
}

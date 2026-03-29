import ContractVersionButton from './ContractVersionButton';
import ErrorBoundary from './ErrorBoundary';
import HelpButton from './HelpButton';
import NetworkButton from './NetworkButton';
import WalletButton from './WalletButton';

interface SettingsNetworkWalletSectionProps {
  className?: string;
}

/**
 * Reusable section containing network selection and wallet connection.
 * Includes error boundaries for error handling.
 */
export default function SettingsNetworkWalletSection ({
  className = 'justify-self-end flex items-center shadow-standard rounded-lg',
}: SettingsNetworkWalletSectionProps) {
  return (
    <div className={className}>
      <ErrorBoundary
      description="Help button is temporarily unavailable."
      fallback={null}
      title="Help button error">
        <HelpButton />
      </ErrorBoundary>
      <ErrorBoundary
      description="Network selection is temporarily unavailable."
      fallback={<div className="flex items-center justify-center bg-card-background h-12 border border-interface-border px-3"><span className="text-error">Network connection error</span></div>}
      title="Network connection error">
        <NetworkButton />
      </ErrorBoundary>
      <ErrorBoundary
      description="Version selection is temporarily unavailable."
      fallback={null}
      title="Version selection error">
        <ContractVersionButton />
      </ErrorBoundary>
      <ErrorBoundary
      description="Wallet connection is temporarily unavailable."
      fallback={<div className="flex items-center justify-center gap-2 bg-card-background h-12 rounded-r-lg border border-interface-border px-3"><span className="text-error">Wallet connection error</span></div>}
      title="Wallet connection error">
        <WalletButton />
      </ErrorBoundary>
    </div>
  );
}

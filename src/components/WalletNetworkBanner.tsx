import { AlertTriangle, Loader2 } from 'lucide-react';
import { Network } from '../config/networks';

interface WalletNetworkBannerProps {
  isSwitching: boolean;
  network: Network;
  onSwitch: () => void;
  walletNetwork: Network | undefined;
}

/**
 * Says that the wallet is on another network from the page's, which makes the page read-only,
 * and offers to switch it.
 */
export default function WalletNetworkBanner ({
  isSwitching,
  network,
  onSwitch,
  walletNetwork,
}: WalletNetworkBannerProps) {
  return (
    <div
    className="mx-auto mb-6 w-full max-w-5xl flex flex-wrap items-center gap-3 shadow-standard rounded-lg border border-attention bg-card-background py-4 px-6"
    role="status">
      {isSwitching ? (
        <>
          <Loader2 className="size-5 shrink-0 animate-spin text-warning" />
          <p className="flex-1">Waiting for your wallet to switch to {network.displayName}…</p>
        </>
      ) : (
        <>
          <AlertTriangle className="size-5 shrink-0 text-warning" />
          <p className="flex-1">
            Your wallet is on {walletNetwork?.displayName ?? 'another network'}. Switch it to {network.displayName} to make changes here.
          </p>
          <button
          className="btn btn-sm btn-outline btn-primary"
          onClick={onSwitch}
          type="button">
            Switch network
          </button>
        </>
      )}
    </div>
  );
}

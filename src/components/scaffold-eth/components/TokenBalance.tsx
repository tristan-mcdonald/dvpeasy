import { AssetType } from '../../../lib/token-manager';
import { memo } from 'react';

/**
 * Props for the TokenBalance component.
 */
interface TokenBalanceProps {
  /** The address whose balance is being displayed */
  balanceAddress?: string;
  /** Optional custom address for balance display (overrides connected address) */
  addressForBalance?: string;
  /** The type of asset (ERC20, ERC721, ETH) */
  assetType: AssetType | null;
  /** Whether NFT balance is currently loading */
  isLoadingNftBalance: boolean;
  /** NFT balance value (for ERC721 tokens) */
  nftBalance: bigint | null;
  /** Whether ERC20/ETH balance is currently loading */
  isLoadingBalance: boolean;
  /** User balance data from wagmi useBalance hook */
  userBalance: { formatted: string; symbol?: string } | undefined;
  /** Token symbol for display */
  tokenSymbol: string;
}

/**
 * TokenBalance component for displaying token balance information.
 *
 * Handles different asset types and loading states:
 * - ERC721: Shows NFT count with appropriate ownership messaging
 * - ERC20/ETH: Shows formatted balance with decimal precision
 * - Loading states: Shows appropriate loading indicators
 *
 * Features:
 * - Contextual messaging based on balance address source
 * - Proper handling of different asset types
 * - Consistent formatting and loading states
 * - Memoized for performance optimization
 *
 * @param props - Component props
 * @returns JSX element representing the token balance display
 *
 * @example
 * ```tsx
 * <TokenBalance
 *   balanceAddress="0x123…"
 *   assetType={AssetType.ERC20}
 *   isLoadingBalance={false}
 *   userBalance={{ formatted: "100.5", symbol: "DAI" }}
 *   tokenSymbol="DAI"
 * />
 * ```
 */
export const TokenBalance = memo<TokenBalanceProps>(({
  balanceAddress,
  addressForBalance,
  assetType,
  isLoadingNftBalance,
  nftBalance,
  isLoadingBalance,
  userBalance,
  tokenSymbol,
}) => {
  if (!balanceAddress) {
    return <span>Valid token address detected</span>;
  }

  // Display messaging based on balance address source.
  const ownershipText = addressForBalance
    ? 'The from address owns'
    : 'Your connected address owns';

  const balanceText = addressForBalance
    ? 'The from address\' balance of this token is'
    : 'Your connected address\' balance of this token is';

  // Handle ERC721 (NFT) balance display.
  if (assetType === AssetType.ERC721) {
    return (
      <>
        <span className="inline-block pr-1">{ownershipText}</span>
        {isLoadingNftBalance ? (
          <span className="text-xs">Loading…</span>
        ) : nftBalance !== null ? (
          <span className="font-mono">{nftBalance.toString()} {tokenSymbol}</span>
        ) : (
          <span className="font-mono">0 {tokenSymbol}</span>
        )}
      </>
    );
  }

  // Handle ERC20/ETH balance display.
  return (
    <>
      <span className="inline-block pr-1">{balanceText}</span>
      {isLoadingBalance ? (
        <span className="text-text-disabled">loading…</span>
      ) : userBalance ? (
        <span className="font-mono">
          {parseFloat(userBalance.formatted).toFixed(4)} {tokenSymbol || userBalance.symbol}
        </span>
      ) : (
        <span className="font-mono">{parseFloat('0').toFixed(4)}</span>
      )}
    </>
  );
});

TokenBalance.displayName = 'TokenBalance';

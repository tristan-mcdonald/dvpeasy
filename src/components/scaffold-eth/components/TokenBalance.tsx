import { AssetType } from '../../../lib/token-metadata';
import { memo } from 'react';
import { tokenManager } from '../../../lib/token-manager';

interface TokenBalanceProps {
  // The address whose balance is shown: the flow's sender, or else the connected wallet.
  balanceAddress?: string;
  // Set when the balance is the flow's sender's, which changes the wording.
  addressForBalance?: string;
  assetType: AssetType | null;
  isLoadingNftBalance: boolean;
  nftBalance: bigint | null;
  isLoadingBalance: boolean;
  userBalance: { formatted: string; symbol?: string } | undefined;
  tokenSymbol: string;
}

/**
 * How much of the chosen token an address holds: a count of NFTs, or a balance to four decimal
 * places.
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

  const ownershipText = addressForBalance
    ? 'The from address owns'
    : 'Your connected address owns';

  const balanceText = addressForBalance
    ? 'The from address\' balance of this token is'
    : 'Your connected address\' balance of this token is';

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

  return (
    <>
      <span className="inline-block pr-1">{balanceText}</span>
      {isLoadingBalance ? (
        <span className="text-text-disabled">loading…</span>
      ) : userBalance ? (
        <span className="font-mono">
          {tokenManager.formatBalance(userBalance.formatted)} {tokenSymbol || userBalance.symbol}
        </span>
      ) : (
        <span className="font-mono">{tokenManager.formatBalance('0')}</span>
      )}
    </>
  );
});

TokenBalance.displayName = 'TokenBalance';

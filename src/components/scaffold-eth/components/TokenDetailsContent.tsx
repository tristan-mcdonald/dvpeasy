import Tooltip from '../../Tooltip';
import { AssetType } from '../../../lib/token-manager';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { chainManager } from '../../../lib/chain-manager';
import { logger } from '../../../lib/logger';
import { memo, useState } from 'react';
import { TOKEN_BUTTON_CLASSES } from '../utils/tokenSizeUtils';
import { TokenBalance } from './TokenBalance';
import { TokenLogoResolver } from './TokenLogoResolver';

/**
 * Props for the TokenDetailsContent component.
 */
interface TokenDetailsContentProps {
  /** The token address being displayed */
  debouncedAddress: string;
  /** Token symbol for display */
  tokenSymbol: string;
  /** Current chain ID */
  chainId: number;
  /** The address whose balance is being displayed */
  balanceAddress?: string;
  /** Optional custom address for balance display */
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
  /** Whether this is a custom token */
  isCustomToken: boolean;
  /** Stored token data from selection (includes logo URLs) */
  storedTokenData?: {
    address: string;
    symbol?: string;
    name?: string;
    chainId?: number;
    logoUrl?: string;
    trustWalletLogoUrl?: string;
  } | null;
}

/**
 * TokenDetailsContent component for displaying comprehensive token information.
 *
 * Shows:
 * - Token logo with fallback system
 * - Token symbol and basic information
 * - `Copy address` and `view on block explorer` buttons
 * - Balance information based on asset type
 *
 * Features:
 * - Clipboard integration for address copying
 * - External link to block explorer for token verification
 * - Contextual balance display based on asset type
 * - Memoized for performance optimization
 *
 * @param props - Component props
 * @returns JSX element representing the token details panel
 *
 * @example
 * ```tsx
 * <TokenDetailsContent
 * debouncedAddress="0x123…"
 * tokenSymbol="DAI"
 * chainId={1}
 * assetType={AssetType.ERC20}
 * isCustomToken={false}
 * // …other props
 * />
 * ```
 */
export const TokenDetailsContent = memo<TokenDetailsContentProps>(({
  debouncedAddress,
  tokenSymbol,
  chainId,
  balanceAddress,
  addressForBalance,
  assetType,
  isLoadingNftBalance,
  nftBalance,
  isLoadingBalance,
  userBalance,
  isCustomToken,
  storedTokenData,
}) => {
  const [copied, setCopied] = useState(false);

  /**
   * Copies the token address to the clipboard.
   * Shows a temporary success indicator for user feedback.
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(debouncedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy address:', error);
    }
  };

  // Get the block explorer URL for the current chain and token address.
  const blockExplorerUrl = chainManager.blockExplorerAddressUrl(chainId, debouncedAddress);

  return (
    <div className="flex items-center justify-start gap-2 px-4 py-2">
      {tokenSymbol && (
        <>
          <div className="flex items-center gap-2">
            <TokenLogoResolver
            isCustomToken={isCustomToken}
            size="sm"
            token={{
              address: debouncedAddress,
              symbol: tokenSymbol,
              name: storedTokenData?.name || tokenSymbol,
              chainId: chainId,
              logoUrl: storedTokenData?.logoUrl,
              trustWalletLogoUrl: storedTokenData?.trustWalletLogoUrl || `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${debouncedAddress}/logo.png`,
            }} />
            <span className="font-mono font-medium">{tokenSymbol}</span>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip content="Copy token address">
              <button
              className={`${TOKEN_BUTTON_CLASSES.base} ${TOKEN_BUTTON_CLASSES.primary}`}
              onClick={copyToClipboard}
              type="button">
                {copied ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="transition-colors size-4" />
                )}
              </button>
            </Tooltip>

            {blockExplorerUrl && (
              <Tooltip content="View token address on block explorer">
                <a
                className={`${TOKEN_BUTTON_CLASSES.base} ${TOKEN_BUTTON_CLASSES.primary}`}
                href={blockExplorerUrl}
                rel="noopener,noreferrer"
                target="_blank">
                  <ExternalLink className="transition-colors size-4"/>
                </a>
              </Tooltip>
            )}
          </div>
        </>
      )}

      <span className="inline-block ml-auto text-sm">
        <TokenBalance
        addressForBalance={addressForBalance}
        assetType={assetType}
        balanceAddress={balanceAddress}
        isLoadingBalance={isLoadingBalance}
        isLoadingNftBalance={isLoadingNftBalance}
        nftBalance={nftBalance}
        tokenSymbol={tokenSymbol}
        userBalance={userBalance} />
      </span>
    </div>
  );
});

TokenDetailsContent.displayName = 'TokenDetailsContent';

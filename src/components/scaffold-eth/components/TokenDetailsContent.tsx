import Tooltip from '../../Tooltip';
import { AssetType } from '../../../lib/token-metadata';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { networkLinks } from '../../../lib/network-links';
import { memo } from 'react';
import { TOKEN_BUTTON_CLASSES } from '../utils/tokenSizeUtils';
import { TokenBalance } from './TokenBalance';
import { TokenLogoResolver } from './TokenLogoResolver';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

interface TokenDetailsContentProps {
  debouncedAddress: string;
  tokenSymbol: string;
  chainId: number;
  balanceAddress?: string;
  addressForBalance?: string;
  assetType: AssetType | null;
  isLoadingNftBalance: boolean;
  nftBalance: bigint | null;
  isLoadingBalance: boolean;
  userBalance: { formatted: string; symbol?: string } | undefined;
  isCustomToken: boolean;
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
 * The chosen token in the token selector: its logo and symbol, buttons to copy its address and
 * open it in the block explorer, and a balance of it.
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
  const { copiedText, copy } = useCopyToClipboard();

  const blockExplorerUrl = networkLinks.address(chainId, debouncedAddress);

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
              onClick={() => copy(debouncedAddress)}
              type="button">
                {copiedText === debouncedAddress ? (
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
                rel="noopener noreferrer"
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

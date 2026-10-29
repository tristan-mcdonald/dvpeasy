import { FC, useEffect, useState } from 'react';
import { isAddress } from 'viem';
import { ArrowDownRight, ArrowUpRight, Coins, Hash, X } from 'lucide-react';
import { AssetType } from '../../lib/token-metadata';
import { TokenDetectionError } from '../../types/errors';
import { utilityManager } from '../../lib/utils';
import { inputValidationManager } from '../../lib/validation';
import { FlowDraft } from '../../types/settlement';
import LabelWithIcon from '../LabelWithIcon';
import NFTImage from '../NFTImage';
import { TokenSelect } from './TokenSelect';
import { useTokenMetadata } from '../../hooks/useTokenMetadata';

interface FlowInputProps {
  flow: FlowDraft;
  onChange: (flow: FlowDraft) => void;
  isDraggable?: boolean;
  id?: string;
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * One flow's fields in the flow dialog: sender, receiver, token, and the amount or NFT ID, which is
 * checked against the token's type.
 */
export const FlowInput: FC<FlowInputProps> = ({
  flow,
  onChange,
  onValidationChange,
}) => {
  const [showNFTModal, setShowNFTModal] = useState(false);
  const tokenMetadataQuery = useTokenMetadata(flow.token);
  const assetType = tokenMetadataQuery.data?.assetType ?? null;
  const tokenSymbol = assetType === AssetType.ERC721 ? '' : tokenMetadataQuery.data?.symbol ?? '';
  const error = tokenError(flow.token, tokenMetadataQuery.error);
  const amountError = flow.amount && assetType ? amountValidationError(flow.amount, assetType) : null;

  // Keep the flow's `isNFT` in step with the token's type once it's known.
  useEffect(() => {
    if (assetType && flow.isNFT !== (assetType === AssetType.ERC721)) {
      onChange({ ...flow, isNFT: assetType === AssetType.ERC721 });
    }
  }, [assetType, flow, onChange]);

  // Tells the dialog whether the flow can be added.
  useEffect(() => {
    if (onValidationChange) {
      const isValid =
        flow.token.trim() !== '' &&
        isAddress(flow.token) &&
        flow.from.trim() !== '' &&
        isAddress(flow.from) &&
        flow.to.trim() !== '' &&
        isAddress(flow.to) &&
        flow.amount.trim() !== '' &&
        !error &&
        !amountError;

      onValidationChange(isValid);
    }
  }, [flow.token, flow.from, flow.to, flow.amount, error, amountError, onValidationChange]);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <LabelWithIcon icon={<ArrowUpRight className="size-4" />} htmlFor="fromAddress">From address</LabelWithIcon>
          <input
          className="input-standard"
          {...utilityManager.createTrimmedInputProps(flow.from, (value) => onChange({ ...flow, from: value }))}
          placeholder="0x…"
          required
          name="fromAddress"
          id="fromAddress"
          type="text"/>
        </div>

        <div>
          <LabelWithIcon icon={<ArrowDownRight className="size-4" />} htmlFor="toAddress">To address</LabelWithIcon>
          <input
          className="input-standard"
          {...utilityManager.createTrimmedInputProps(flow.to, (value) => onChange({ ...flow, to: value }))}
          placeholder="0x…"
          required
          id="toAddress"
          name="toAddress"
          type="text"/>
        </div>
      </div>

      <TokenSelect
      addressForBalance={flow.from}
      icon={<Coins className="size-4" />}
      label="Token address"
      onChange={(value) => onChange({ ...flow, token: value })}
      placeholder="0x…"
      value={flow.token} />

      <div>
        <LabelWithIcon icon={<Hash className="size-4" />} htmlFor='amount'>
          {assetType === AssetType.ERC721 ? 'NFT Token ID' : 'Amount'}
        </LabelWithIcon>
        <div className="relative">
          <input
          className={`input-standard ${assetType === AssetType.ERC721 && flow.token && flow.amount && !amountError && !error ? 'pr-16' : 'pr-20'} ${amountError ? 'border-error focus:border-error focus:ring-red-100' : ''}`}
          {...utilityManager.createTrimmedInputProps(flow.amount, (value) => onChange({ ...flow, amount: value }))}
          placeholder={assetType === AssetType.ERC721 ? 'Token ID' : '0.0'}
          required
          name="amount"
          id="amount"
          type="text"/>
          {assetType !== AssetType.ERC721 && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-input-placeholder">
              <span className="font-mono">{tokenSymbol || 'tokens'}</span>
            </div>
          )}
          {assetType === AssetType.ERC721 && flow.token && flow.amount && !amountError && !error && (
            <>
              <div className="absolute inset-y-0 right-2 flex items-center">
                <button
                className="cursor-pointer size-10 p-0 transition overflow-hidden rounded-lg bg-input-background border border-input-border focus:border-input-border-focus focus:ring-4 focus:ring-input-outline-focus focus:outline-none hover:border-input-border-focus hover:ring-4 hover:ring-input-outline-focus"
                aria-label="View NFT preview"
                onClick={() => setShowNFTModal(true)}
                type="button">
                  <NFTImage
                  size="thumbnail"
                  tokenAddress={flow.token}
                  tokenId={flow.amount} />
                </button>
              </div>

              {showNFTModal && (
                <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => setShowNFTModal(false)}>
                  <div
                  className="bg-card-background border border-interface-border rounded-lg p-6 max-w-md mx-4"
                  onClick={(event) => event.stopPropagation()}>
                    <div className="space-y-6">
                      <div className="flex flex-row justify-end items-center">
                        <button
                        aria-label="Close"
                        className="transition-colors cursor-pointer text-primary hover:text-primary-interaction"
                        onClick={() => setShowNFTModal(false)}>
                          <X />
                        </button>
                      </div>
                      <NFTImage
                      showTokenId={true}
                      size="large"
                      tokenAddress={flow.token}
                      tokenId={flow.amount}/>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {amountError && (
          <span className="block mt-2 text-error text-sm">{amountError}</span>
        )}
      </div>



      {error && (
        <span className="block mt-2 text-error text-sm">{error}</span>
      )}
    </div>
  );
};

/**
 * Why the flow's token can't be used, if it can't.
 */
function tokenError (tokenAddress: string, metadataError: Error | null): string | null {
  if (!tokenAddress) return null;
  if (!isAddress(tokenAddress)) return 'Failed to detect token type';
  if (!metadataError) return null;
  return metadataError instanceof TokenDetectionError ? metadataError.message : 'Failed to detect token type';
}

function amountValidationError (amount: string, assetType: AssetType): string | null {
  const validation = assetType === AssetType.ERC721
    ? inputValidationManager.validateNFTTokenId(amount)
    : inputValidationManager.validateTokenAmount(amount);
  return validation.isValid ? null : validation.error || null;
}

import toast from 'react-hot-toast';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useWalletClient } from 'wagmi';
import { simulateContract, waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { isAddressEqual, keccak256, toHex } from 'viem';
import { config } from '../config/wagmi';
import { DVP_ABI } from '../config/contracts/abis';
import { ContractValidationError, contractValidationManager, ValidatedFlowDraft } from '../lib/contract-validation';
import { errorManager } from '../lib/error-manager';
import { logger } from '../lib/logger';
import { AssetType } from '../lib/token-metadata';
import { TokenDetectionError } from '../types/errors';
import { tokenManager } from '../lib/token-manager';
import { urlManager } from '../lib/url-manager';
import { Flow, FlowDraft } from '../types/settlement';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useFetchTokenMetadata } from './useTokenMetadata';

/**
 * Hook for handling settlement creation logic.
 * Manages form validation, contract interaction, and transaction handling.
 */
export function useSettlementCreation () {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const networkDeployment = useCurrentNetwork();
  const { deployment, network } = networkDeployment;
  const [isLoading, setIsLoading] = useState(false);
  const fetchTokenMetadata = useFetchTokenMetadata();

  /**
   * Verify asset type and parse token amount for a flow.
   */
  const verifyAndParseFlow = async (flow: ValidatedFlowDraft): Promise<Flow> => {
    try {
      // Double-check asset type detection for accuracy.
      const metadata = await fetchTokenMetadata(flow.token);
      const detectedIsNFT = metadata.assetType === AssetType.ERC721;

      if (detectedIsNFT !== flow.isNFT) {
        logger.warn(`Asset type mismatch for ${flow.token}: detected=${detectedIsNFT}, provided=${flow.isNFT}`);
      }

      const amountOrId = tokenManager.parseAmount(flow.amount, metadata);

      return {
        token: flow.token,
        isNFT: flow.isNFT,
        from: flow.from,
        to: flow.to,
        amountOrId: amountOrId,
      };
    } catch (error) {
      logger.error('Error parsing flow:', error);
      if (error instanceof TokenDetectionError) throw error;
      throw new ContractValidationError(
        `Failed to parse flow for token ${flow.token}: ${errorManager.message(error)}`,
        flow,
        'flow',
      );
    }
  };

  /**
   * Double-check asset types as a defensive measure against detection failures.
   */
  const verifyAssetTypes = async (flows: FlowDraft[]): Promise<boolean> => {
    // Defensive check to ensure asset types match blockchain state.
    for (let i = 0; i < flows.length; i++) {
      const flow = flows[i];
      try {
        const { assetType } = await fetchTokenMetadata(flow.token);
        const detectedIsNFT = assetType === AssetType.ERC721;

        if (detectedIsNFT !== flow.isNFT) {
          toast.error(`Flow ${i + 1}: Asset type mismatch. Token appears to be ${detectedIsNFT ? 'NFT' : 'ERC20'} but marked as ${flow.isNFT ? 'NFT' : 'ERC20'}.`);
          return false;
        }
      } catch (error) {
        logger.warn(`Could not verify asset type for flow ${i + 1}:`, error);
      }
    }
    return true;
  };

  /**
   * Create settlement with provided parameters using validation.
   */
  const createSettlement = async (
    flows: FlowDraft[],
    cutoffDate: string,
    reference: string,
    isAutoSettled: boolean,
  ): Promise<void> => {
    if (!isConnected || !address || !walletClient) {
      toast.error('Please connect your wallet.');
      return;
    }

    // Validate and prepare settlement data.
    let validatedSettlement;
    try {
      validatedSettlement = contractValidationManager.validateSettlementForSubmission({
        flows,
        reference,
        cutoffDate,
        isAutoSettled,
      });
    } catch (error) {
      if (error instanceof ContractValidationError) {
        toast.error(error.message);
      } else {
        toast.error(`Validation error: ${errorManager.message(error, 'Unknown validation error')}`);
      }
      return;
    }

    // Double-check asset types in case initial detection failed or was bypassed.
    const assetTypesValid = await verifyAssetTypes(flows);
    if (!assetTypesValid) {
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Creating settlement…');

    try {
      // Verify and parse each flow to get proper amountOrId values.
      const parsedFlows = await Promise.all(validatedSettlement.validatedFlows.map(verifyAndParseFlow));

      let hash: `0x${string}`;
      try {
        const { request } = await simulateContract(config, {
          address: deployment.dvpAddress,
          abi: DVP_ABI,
          functionName: 'createSettlement',
          args: [parsedFlows, validatedSettlement.reference, validatedSettlement.cutoffTimestamp, validatedSettlement.isAutoSettled],
          account: address,
          chainId: network.chainId,
        });

        hash = await writeContract(config, request);
      } catch (error) {
        toast.error(errorManager.report(error), { id: toastId });
        setIsLoading(false);
        return;
      }

      let receipt;
      try {
        receipt = await waitForTransactionReceipt(config, { hash, chainId: network.chainId });
      } catch (error) {
        const errorMessage = 'Failed to confirm transaction; please check your wallet for status.';
        logger.error(errorMessage, error);
        toast.error(errorMessage, { id: toastId });
        setIsLoading(false);
        return;
      }

      const eventSignature = 'SettlementCreated(uint256,address)';
      const eventTopic = keccak256(toHex(eventSignature));
      const settlementCreatedEvent = receipt.logs.find(log =>
        isAddressEqual(log.address, deployment.dvpAddress) && log.topics[0] === eventTopic,
      );

      if (settlementCreatedEvent?.topics[1]) {
        try {
          const settlementId = contractValidationManager.validateSettlementId(BigInt(settlementCreatedEvent.topics[1]));
          const settlementIdDecimal = settlementId.toString();

          toast.success('Settlement created successfully!', { id: toastId });
          navigate(urlManager.buildSettlementUrl(network.id, deployment.version.tag, settlementIdDecimal));
        } catch (error) {
          logger.error('Failed to validate settlement ID from event:', error);
          toast.error('Settlement created but ID validation failed.', { id: toastId });
        }
      } else {
        logger.error('Settlement created but no event found in transaction receipt');
        toast.error('Settlement created but could not retrieve ID.', { id: toastId });
      }
    } catch (error) {
      const errorMessage = error instanceof ContractValidationError
        ? error.message
        : errorManager.report(error);
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createSettlement,
    isConnected,
  };
}

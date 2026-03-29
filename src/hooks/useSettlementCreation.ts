import toast from 'react-hot-toast';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useWalletClient } from 'wagmi';
import { simulateContract, waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { keccak256, toHex } from 'viem';
import { config } from '../config/wagmi';
import { contractConfigManager } from '../config/contracts';
import { ContractValidationError, contractValidationManager } from '../lib/contract-validation';
import { logger } from '../lib/logger';
import { settlementErrorManager } from '../lib/settlement-error-utils';
import { AssetType, tokenManager } from '../lib/token-manager';
import { urlManager } from '../lib/url-manager';
import { Flow } from '../types/settlement';
import { useContractAddresses } from './useContractConfig';

/**
 * Hook for handling settlement creation logic.
 * Manages form validation, contract interaction, and transaction handling.
 */
export function useSettlementCreation () {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { dvpAddress, dvpAbi } = useContractAddresses();
  const [isLoading, setIsLoading] = useState(false);


  /**
   * Verify asset type and parse token amount for a flow.
   */
  const verifyAndParseFlow = async (flow: Flow) => {
    try {
      // Double-check asset type detection for accuracy.
      const assetType = await tokenManager.detectAssetType(flow.token);
      const detectedIsNFT = assetType === AssetType.ERC721;

      if (detectedIsNFT !== flow.isNFT) {
        logger.warn(`Asset type mismatch for ${flow.token}: detected=${detectedIsNFT}, provided=${flow.isNFT}`);
      }

      // Parse the amount properly using parseTokenAmount.
      const amountOrId = await tokenManager.parseTokenAmount(flow.amount, flow.token);

      return {
        token: flow.token,
        isNFT: flow.isNFT,
        from: flow.from,
        to: flow.to,
        amountOrId: amountOrId,
      };
    } catch (error) {
      logger.error('Error parsing flow:', error);
      throw new Error(`Failed to parse flow for token ${flow.token}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Double-check asset types as a defensive measure against detection failures.
   */
  const verifyAssetTypes = async (flows: Flow[]): Promise<boolean> => {
    // Defensive check to ensure asset types match blockchain state.
    for (let i = 0; i < flows.length; i++) {
      const flow = flows[i];
      try {
        const assetType = await tokenManager.detectAssetType(flow.token);
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
    flows: Flow[],
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
        flows: flows.map(flow => ({
          token: flow.token,
          from: flow.from,
          to: flow.to,
          amount: flow.amount,
          isNFT: flow.isNFT,
        })),
        reference,
        cutoffDate,
        isAutoSettled,
      });
    } catch (error) {
      if (error instanceof ContractValidationError) {
        toast.error(error.message);
      } else {
        toast.error(`Validation error: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
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
      const parsedFlows = await Promise.all(flows.map(verifyAndParseFlow));

      let hash: `0x${string}`;
      try {
        const { request } = await simulateContract(config, {
          address: dvpAddress,
          abi: dvpAbi,
          functionName: 'createSettlement',
          args: [parsedFlows, validatedSettlement.reference, validatedSettlement.cutoffTimestamp, validatedSettlement.isAutoSettled],
          account: address,
        });

        hash = await writeContract(config, request);
      } catch (error) {
        const errorMessage = await settlementErrorManager.getSettlementErrorMessage(error);
        toast.error(errorMessage, { id: toastId });
        setIsLoading(false);
        return;
      }

      let receipt;
      try {
        receipt = await waitForTransactionReceipt(config, { hash });
      } catch (error) {
        const errorMessage = 'Failed to confirm transaction; please check your wallet for status.';
        logger.error(errorMessage, error);
        toast.error(errorMessage, { id: toastId });
        setIsLoading(false);
        return;
      }

      const eventSignature = 'SettlementCreated(uint256,address)';
      const eventTopic = keccak256(toHex(eventSignature));
      const settlementCreatedEvent = receipt.logs.find(log => log.topics[0] === eventTopic);

      if (settlementCreatedEvent?.topics[1]) {
        try {
          const settlementId = contractValidationManager.validateSettlementId(BigInt(settlementCreatedEvent.topics[1]));
          const settlementIdDecimal = settlementId.toString();

          // Get current network and version for URL.
          const currentConfig = contractConfigManager.getCurrentConfig();
          const currentVersion = contractConfigManager.getCurrentVersion();

          toast.success('Settlement created successfully!', { id: toastId });
          navigate(urlManager.buildSettlementUrl(currentConfig.networkId, currentVersion, settlementIdDecimal));
        } catch (error) {
          logger.error('Failed to validate settlement ID from event:', error);
          toast.error('Settlement created but ID validation failed.', { id: toastId });
        }
      } else {
        logger.error('Settlement created but no event found in transaction receipt');
        toast.error('Settlement created but could not retrieve ID.', { id: toastId });
      }
    } catch (error) {
      logger.error('Settlement creation error:', error);
      const errorMessage = await settlementErrorManager.getSettlementErrorMessage(error);
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

import toast from 'react-hot-toast';
import { useCallback, useState } from 'react';
import { Address, WalletClient } from 'viem';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { config } from '../config/wagmi';
import { DVP_ABI } from '../config/contracts/abis';
import { ContractValidationError } from '../types/errors';
import { contractValidationManager } from '../lib/contract-validation';
import { errorManager } from '../lib/error-manager';
import { PartyStatus } from '../types/settlement';
import { tokenManager } from '../lib/token-manager';
import { useCurrentNetwork } from './useCurrentNetwork';
import { useFetchTokenMetadata } from './useTokenMetadata';

interface UseSettlementActionsProps {
  settlementId: string | undefined;
  address: Address | undefined;
  walletClient: WalletClient | undefined;
  partyStatus: PartyStatus | null;
  onSuccess?: () => void;
}

export function useSettlementActions ({
  settlementId,
  address,
  walletClient,
  partyStatus,
  onSuccess,
}: UseSettlementActionsProps) {
  const networkDeployment = useCurrentNetwork();
  const { dvpAddress } = networkDeployment.deployment;
  const { chainId } = networkDeployment.network;
  const [isApproving, setIsApproving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [approvingToken, setApprovingToken] = useState<string | null>(null);
  const fetchTokenMetadata = useFetchTokenMetadata();

  /**
   * Lets the DVP contract move a token, as an ERC-20 allowance or an ERC-721 approval.
   */
  const approveToken = useCallback(async (account: Address, tokenAddress: string, amount: bigint) => {
    const { assetType } = await fetchTokenMetadata(tokenAddress);
    await tokenManager.approveToken({
      account,
      amount,
      assetType,
      networkDeployment,
      spender: dvpAddress,
      tokenAddress,
    });
  }, [fetchTokenMetadata, networkDeployment, dvpAddress]);

  const handleApprove = useCallback(async () => {
    if (!settlementId || !address || !walletClient) {
      toast.error('Please connect your wallet.');
      return;
    }

    // Validate inputs.
    try {
      contractValidationManager.validateSettlementId(settlementId);
      if (!contractValidationManager.isValidAddress(address)) {
        throw new ContractValidationError('Invalid wallet address', address, 'address');
      }
    } catch (error) {
      if (error instanceof ContractValidationError) {
        toast.error(`Validation error: ${error.message}`);
      } else {
        toast.error('Invalid input parameters.');
      }
      return;
    }

    setIsApproving(true);
    const toastId = toast.loading('Approving settlement…');

    try {
      const validatedSettlementId = contractValidationManager.validateSettlementId(settlementId);
      const result = await writeContract(config, {
        address: dvpAddress,
        abi: DVP_ABI,
        functionName: 'approveSettlements',
        args: [[validatedSettlementId]],
        account: address,
        chainId,
        value: partyStatus?.etherRequired || 0n,
      });
      await waitForTransactionReceipt(config, { hash: result, chainId });

      toast.success('Settlement approved successfully!', { id: toastId });
      onSuccess?.();
    } catch (error) {
      toast.error(errorManager.report(error, { settlementId, address }), { id: toastId });
    } finally {
      setIsApproving(false);
    }
  }, [settlementId, address, walletClient, partyStatus, onSuccess, dvpAddress, chainId]);

  const handleExecuteSettlement = useCallback(async () => {
    if (!settlementId || !address || !walletClient) {
      toast.error('Please connect your wallet.');
      return;
    }

    // Validate inputs.
    try {
      contractValidationManager.validateSettlementId(settlementId);
      if (!contractValidationManager.isValidAddress(address)) {
        throw new ContractValidationError('Invalid wallet address', address, 'address');
      }
    } catch (error) {
      if (error instanceof ContractValidationError) {
        toast.error(`Validation error: ${error.message}`);
      } else {
        toast.error('Invalid input parameters.');
      }
      return;
    }

    setIsExecuting(true);
    const toastId = toast.loading('Executing settlement…');

    try {
      const validatedSettlementId = contractValidationManager.validateSettlementId(settlementId);
      const result = await writeContract(config, {
        address: dvpAddress,
        abi: DVP_ABI,
        functionName: 'executeSettlement',
        args: [validatedSettlementId],
        account: address,
        chainId,
      });
      await waitForTransactionReceipt(config, { hash: result, chainId });

      toast.success('Settlement executed successfully!', { id: toastId });
      onSuccess?.();
    } catch (error) {
      toast.error(errorManager.report(error, { settlementId, address }), { id: toastId });
    } finally {
      setIsExecuting(false);
    }
  }, [settlementId, address, walletClient, onSuccess, dvpAddress, chainId]);

  const handleApproveToken = useCallback(async (tokenAddress: string, amount: bigint) => {
    if (!address || !walletClient) {
      toast.error('Please connect your wallet.');
      return;
    }

    // Validate inputs.
    try {
      if (!contractValidationManager.isValidAddress(address)) {
        throw new ContractValidationError('Invalid wallet address', address, 'address');
      }
      if (!contractValidationManager.isValidAddress(tokenAddress)) {
        throw new ContractValidationError('Invalid token address', tokenAddress, 'tokenAddress');
      }
      contractValidationManager.validateAmountOrId(amount, false); // Assuming ERC20 token approval
    } catch (error) {
      if (error instanceof ContractValidationError) {
        toast.error(`Validation error: ${error.message}`);
      } else {
        toast.error('Invalid input parameters.');
      }
      return;
    }

    setApprovingToken(tokenAddress);
    const toastId = toast.loading('Approving token…');

    try {
      await approveToken(address, tokenAddress, amount);

      toast.success('Token approved successfully!', { id: toastId });
      onSuccess?.();
    } catch (error) {
      toast.error(errorManager.report(error, { tokenAddress, address }), { id: toastId });
    } finally {
      setApprovingToken(null);
    }
  }, [address, walletClient, onSuccess, approveToken]);

  const handleMaxApprove = useCallback(async (tokenAddress: string) => {
    if (!address || !walletClient) {
      toast.error('Please connect your wallet.');
      return;
    }

    setApprovingToken(tokenAddress);
    const toastId = toast.loading('Approving maximum token amount…');

    try {
      const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      await approveToken(address, tokenAddress, maxUint256);

      toast.success('Token approved successfully!', { id: toastId });
      onSuccess?.();
    } catch (error) {
      toast.error(errorManager.report(error, { tokenAddress, address }), { id: toastId });
    } finally {
      setApprovingToken(null);
    }
  }, [address, walletClient, onSuccess, approveToken]);

  const handleRevokeApproval = useCallback(async () => {
    if (!settlementId || !address || !walletClient) {
      toast.error('Please connect your wallet.');
      return;
    }

    setIsRevoking(true);
    const toastId = toast.loading('Revoking approval…');

    try {
      const result = await writeContract(config, {
        address: dvpAddress,
        abi: DVP_ABI,
        functionName: 'revokeApprovals',
        args: [[BigInt(settlementId)]],
        account: address as `0x${string}`,
        chainId,
      });
      await waitForTransactionReceipt(config, { hash: result, chainId });

      toast.success('Approval revoked successfully!', { id: toastId });
      onSuccess?.();
    } catch (error) {
      toast.error(errorManager.report(error, { settlementId, address }), { id: toastId });
    } finally {
      setIsRevoking(false);
    }
  }, [settlementId, address, walletClient, onSuccess, dvpAddress, chainId]);

  const handleWithdrawETH = useCallback(async () => {
    if (!settlementId || !address || !walletClient) {
      toast.error('Please connect your wallet.');
      return;
    }

    setIsWithdrawing(true);
    const toastId = toast.loading('Withdrawing ETH…');

    try {
      const result = await writeContract(config, {
        address: dvpAddress,
        abi: DVP_ABI,
        functionName: 'withdrawETH',
        args: [[BigInt(settlementId)]],
        account: address as `0x${string}`,
        chainId,
      });
      await waitForTransactionReceipt(config, { hash: result, chainId });

      toast.success('ETH withdrawn successfully', { id: toastId });
      onSuccess?.();
    } catch (error) {
      toast.error(errorManager.report(error, { settlementId, address }), { id: toastId });
    } finally {
      setIsWithdrawing(false);
    }
  }, [settlementId, address, walletClient, onSuccess, dvpAddress, chainId]);

  return {
    isApproving,
    isExecuting,
    isRevoking,
    isWithdrawing,
    approvingToken,
    handleApprove,
    handleExecuteSettlement,
    handleApproveToken,
    handleMaxApprove,
    handleRevokeApproval,
    handleWithdrawETH,
  };
}

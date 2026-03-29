import toast from 'react-hot-toast';
import { useCallback, useState } from 'react';
import { Address, WalletClient } from 'viem';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';
import { config } from '../config/wagmi';
import { ContractValidationError, contractValidationManager, PartyStatus as ValidatedPartyStatus } from '../lib/contract-validation';
import { errorManager } from '../lib/error-manager';
import { tokenManager } from '../lib/token-manager';
import { useContractAddresses } from './useContractConfig';

type PartyStatus = ValidatedPartyStatus;

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
  const { dvpAddress, dvpAbi } = useContractAddresses();
  const [isApproving, setIsApproving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [approvingToken, setApprovingToken] = useState<string | null>(null);

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
        abi: dvpAbi,
        functionName: 'approveSettlements',
        args: [[validatedSettlementId]],
        account: address,
        chainId: walletClient.chain?.id,
        value: partyStatus?.etherRequired || 0n,
      });
      await waitForTransactionReceipt(config, { hash: result });

      toast.success('Settlement approved successfully!', { id: toastId });
      onSuccess?.();
    } catch (error) {
      if (error instanceof ContractValidationError) {
        toast.error(`Validation error: ${error.message}`, { id: toastId });
      } else {
        const parsedError = errorManager.parse(error, { settlementId, operation: 'approveSettlement' });
        errorManager.log(parsedError, { settlementId, address });
        toast.error(errorManager.formatUserMessage(parsedError), { id: toastId });
      }
    } finally {
      setIsApproving(false);
    }
  }, [settlementId, address, walletClient, partyStatus, onSuccess, dvpAddress, dvpAbi]);

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
        abi: dvpAbi,
        functionName: 'executeSettlement',
        args: [validatedSettlementId],
        account: address,
        chainId: walletClient.chain?.id,
      });
      await waitForTransactionReceipt(config, { hash: result });

      toast.success('Settlement executed successfully!', { id: toastId });
      onSuccess?.();
    } catch (error) {
      if (error instanceof ContractValidationError) {
        toast.error(`Validation error: ${error.message}`, { id: toastId });
      } else {
        const parsedError = errorManager.parse(error, { settlementId, operation: 'executeSettlement' });
        errorManager.log(parsedError, { settlementId, address });
        toast.error(errorManager.formatUserMessage(parsedError), { id: toastId });
      }
    } finally {
      setIsExecuting(false);
    }
  }, [settlementId, address, walletClient, onSuccess, dvpAddress, dvpAbi]);

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
      await tokenManager.approveToken(
        tokenAddress,
        dvpAddress,
        amount,
        address,
      );

      toast.success('Token approved successfully!', { id: toastId });
      onSuccess?.();
    } catch (error) {
      const parsedError = errorManager.parse(error, { tokenAddress, operation: 'approveToken' });
      errorManager.log(parsedError, { tokenAddress, address });
      toast.error(errorManager.formatUserMessage(parsedError), { id: toastId });
    } finally {
      setApprovingToken(null);
    }
  }, [address, walletClient, onSuccess, dvpAddress]);

  const handleMaxApprove = useCallback(async (tokenAddress: string) => {
    if (!address || !walletClient) {
      toast.error('Please connect your wallet.');
      return;
    }

    setApprovingToken(tokenAddress);
    const toastId = toast.loading('Approving maximum token amount…');

    try {
      const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      await tokenManager.approveToken(
        tokenAddress,
        dvpAddress,
        maxUint256,
        address,
      );

      toast.success('Token approved successfully!', { id: toastId });
      onSuccess?.();
    } catch (error) {
      const parsedError = errorManager.parse(error, { tokenAddress, operation: 'maxApproveToken' });
      errorManager.log(parsedError, { tokenAddress, address });
      toast.error(errorManager.formatUserMessage(parsedError), { id: toastId });
    } finally {
      setApprovingToken(null);
    }
  }, [address, walletClient, onSuccess, dvpAddress]);

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
        abi: dvpAbi,
        functionName: 'revokeApprovals',
        args: [[BigInt(settlementId)]],
        account: address as `0x${string}`,
        chainId: walletClient.chain?.id,
      });
      await waitForTransactionReceipt(config, { hash: result });

      toast.success('Approval revoked successfully!', { id: toastId });
      onSuccess?.();
    } catch (error) {
      const parsedError = errorManager.parse(error, { settlementId, operation: 'revokeApproval' });
      errorManager.log(parsedError, { settlementId, address });
      toast.error(errorManager.formatUserMessage(parsedError), { id: toastId });
    } finally {
      setIsRevoking(false);
    }
  }, [settlementId, address, walletClient, onSuccess, dvpAddress, dvpAbi]);

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
        abi: dvpAbi,
        functionName: 'withdrawETH',
        args: [BigInt(settlementId)],
        account: address as `0x${string}`,
        chainId: walletClient.chain?.id,
      });
      await waitForTransactionReceipt(config, { hash: result });

      toast.success('ETH withdrawn successfully', { id: toastId });
      onSuccess?.();
    } catch (error) {
      const parsedError = errorManager.parse(error, { settlementId, operation: 'withdrawETH' });
      errorManager.log(parsedError, { settlementId, address });
      toast.error(errorManager.formatUserMessage(parsedError), { id: toastId });
    } finally {
      setIsWithdrawing(false);
    }
  }, [settlementId, address, walletClient, onSuccess, dvpAddress, dvpAbi]);

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

/**
 * Contract configuration exports.
 * Main entry point for all contract-related configuration.
 */

// Export ABIs.
export { DVP_ABI, DVP_HELPER_ABI, type DvpAbi, type DvpHelperAbi } from './abis';

// Export types.
export type {
  ContractVersion,
  ContractConfig,
  NetworkContractVersions,
  ContractConfigWithNetwork,
  VersionedContractConfigWithNetwork,
} from './types';

// Export network configurations.
export { VERSIONED_CONTRACT_CONFIGS } from './networks';

// Export manager and utilities.
import { contractConfigManager } from './manager';

export { contractConfigManager };
export const publicClient = contractConfigManager.getPublicClient();

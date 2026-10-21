/**
 * Contract configuration exports.
 * Main entry point for all contract-related configuration.
 */

// Export types.
export type {
  ContractVersion,
  ContractConfigWithNetwork,
} from './types';

// Export network configurations.
export { VERSIONED_CONTRACT_CONFIGS } from './networks';

// Export manager and utilities.
import { contractConfigManager } from './manager';

export { contractConfigManager };
export const publicClient = contractConfigManager.getPublicClient();

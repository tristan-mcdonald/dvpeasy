import type { NetworkContractVersions } from '../types';
import { baseContracts } from './base';
import { baseSepoliaContracts } from './baseSepolia';
import { mainnetContracts } from './mainnet';
import { sepoliaContracts } from './sepolia';

/**
 * All versioned contract configurations by network.
 */
export const VERSIONED_CONTRACT_CONFIGS: Record<string, NetworkContractVersions> = {
  base: baseContracts,
  baseSepolia: baseSepoliaContracts,
  mainnet: mainnetContracts,
  sepolia: sepoliaContracts,
};

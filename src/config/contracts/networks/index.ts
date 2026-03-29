import type { NetworkContractVersions } from '../types';
import { arbitrumSepoliaContracts } from './arbitrumSepolia';
import { avalancheContracts } from './avalanche';
import { avalancheFujiContracts } from './avalancheFuji';
import { polygonContracts } from './polygon';
import { sepoliaContracts } from './sepolia';

/**
 * All versioned contract configurations by network.
 */
export const VERSIONED_CONTRACT_CONFIGS: Record<string, NetworkContractVersions> = {
  arbitrumSepolia: arbitrumSepoliaContracts,
  avalanche: avalancheContracts,
  avalancheFuji: avalancheFujiContracts,
  polygon: polygonContracts,
  sepolia: sepoliaContracts,
};

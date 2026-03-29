import type { NetworkContractVersions } from '../types';
import { arbitrumSepoliaContracts } from './arbitrumSepolia';
import { avalancheContracts } from './avalanche';
import { avalancheFujiContracts } from './avalancheFuji';
import { baseContracts } from './base';
import { baseSepoliaContracts } from './baseSepolia';
import { mainnetContracts } from './mainnet';
import { polygonContracts } from './polygon';
import { sepoliaContracts } from './sepolia';

/**
 * All versioned contract configurations by network.
 */
export const VERSIONED_CONTRACT_CONFIGS: Record<string, NetworkContractVersions> = {
  arbitrumSepolia: arbitrumSepoliaContracts,
  avalanche: avalancheContracts,
  avalancheFuji: avalancheFujiContracts,
  base: baseContracts,
  baseSepolia: baseSepoliaContracts,
  mainnet: mainnetContracts,
  polygon: polygonContracts,
  sepolia: sepoliaContracts,
};

import type { NetworkContractVersions } from '../../types';
import { config as v10Config } from './v1.0';

/**
 * Base Sepolia contract versions.
 */
export const baseSepoliaContracts: NetworkContractVersions = {
  networkId: 'baseSepolia',
  defaultVersion: 'v1.0',
  versions: {
    'v1.0': v10Config,
  },
};

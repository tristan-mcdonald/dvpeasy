import type { NetworkContractVersions } from '../../types';
import { config as v09Config } from './v0.9';
import { config as v10Config } from './v1.0';

/**
 * Sepolia network contract versions.
 */
export const sepoliaContracts: NetworkContractVersions = {
  networkId: 'sepolia',
  defaultVersion: 'v1.0',
  versions: {
    'v0.9': v09Config,
    'v1.0': v10Config,
  },
};

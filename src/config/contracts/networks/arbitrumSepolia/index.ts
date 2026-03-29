import type { NetworkContractVersions } from '../../types';
import { config as v09Config } from './v0.9';
import { config as v10Config } from './v1.0';

/**
 * Arbitrum Sepolia network contract versions.
 */
export const arbitrumSepoliaContracts: NetworkContractVersions = {
  networkId: 'arbitrumSepolia',
  defaultVersion: 'v1.0',
  versions: {
    'v0.9': v09Config,
    'v1.0': v10Config,
  },
};

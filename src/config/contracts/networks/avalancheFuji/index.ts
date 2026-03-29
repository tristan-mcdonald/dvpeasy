import type { NetworkContractVersions } from '../../types';
import { config as v10Config } from './v1.0';

/**
 * Avalanche Fuji network contract versions.
 */
export const avalancheFujiContracts: NetworkContractVersions = {
  networkId: 'avalancheFuji',
  defaultVersion: 'v1.0',
  versions: {
    'v1.0': v10Config,
  },
};

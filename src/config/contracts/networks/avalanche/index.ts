import type { NetworkContractVersions } from '../../types';
import { config as v10Config } from './v1.0';

/**
 * Avalanche C-Chain network contract versions.
 */
export const avalancheContracts: NetworkContractVersions = {
  networkId: 'avalanche',
  defaultVersion: 'v1.0',
  versions: {
    'v1.0': v10Config,
  },
};

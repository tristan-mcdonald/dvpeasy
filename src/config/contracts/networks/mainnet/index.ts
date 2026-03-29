import type { NetworkContractVersions } from '../../types';
import { config as v10Config } from './v1.0';

/**
 * Ethereum Mainnet contract versions.
 */
export const mainnetContracts: NetworkContractVersions = {
  networkId: 'mainnet',
  defaultVersion: 'v1.0',
  versions: {
    'v1.0': v10Config,
  },
};

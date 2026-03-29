import type { NetworkContractVersions } from '../../types';
import { config as v10Config } from './v1.0';

/**
 * Base Mainnet contract versions.
 */
export const baseContracts: NetworkContractVersions = {
  networkId: 'base',
  defaultVersion: 'v1.0',
  versions: {
    'v1.0': v10Config,
  },
};

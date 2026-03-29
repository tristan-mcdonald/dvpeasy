import type { NetworkContractVersions } from '../../types';
import { config as v10Config } from './v1.0';

/**
 * Polygon Mainnet network contract versions.
 */
export const polygonContracts: NetworkContractVersions = {
  networkId: 'polygon',
  defaultVersion: 'v1.0',
  versions: {
    'v1.0': v10Config,
  },
};

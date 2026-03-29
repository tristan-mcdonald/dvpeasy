import type { ContractConfig } from '../../types';
import { DVP_ABI } from '../../abis/dvp';
import { DVP_HELPER_ABI } from '../../abis/dvpHelper';

/**
 * Avalanche Fuji v1.0 contract configuration.
 */
export const config: ContractConfig = {
  networkId: 'avalancheFuji',
  dvpAddress: '0xa70404d8ca272bE8bAA48A4b83ED94Db17068e05',
  dvpHelperAddress: '0x8DdC71B21889dd727D7aC5432799406F2901E74a',
  dvpAbi: DVP_ABI,
  dvpHelperAbi: DVP_HELPER_ABI,
  version: {
    tag: 'v1.0',
    name: 'Initial release',
    isDeprecated: false,
    deploymentDate: '2025-09-01',
  },
};

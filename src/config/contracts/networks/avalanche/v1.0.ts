import type { ContractConfig } from '../../types';
import { DVP_ABI } from '../../abis/dvp';
import { DVP_HELPER_ABI } from '../../abis/dvpHelper';

/**
 * Avalanche C-Chain v1.0 contract configuration.
 */
export const config: ContractConfig = {
  networkId: 'avalanche',
  dvpAddress: '0xE87c95AB6a3e11e16E72A2b6234454Bb29130C95',
  dvpHelperAddress: '0xeDFDecC5e1932dd3D99Ee87f370FA89E1901F4F9',
  dvpAbi: DVP_ABI,
  dvpHelperAbi: DVP_HELPER_ABI,
  version: {
    tag: 'v1.0',
    name: 'Initial release',
    isDeprecated: false,
    deploymentDate: '2025-09-01',
  },
};

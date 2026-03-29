import type { ContractConfig } from '../../types';
import { DVP_ABI } from '../../abis/dvp';
import { DVP_HELPER_ABI } from '../../abis/dvpHelper';

/**
 * Arbitrum Sepolia v1.0 contract configuration.
 */
export const config: ContractConfig = {
  networkId: 'arbitrumSepolia',
  dvpAddress: '0xA19B617507fef9866Fc7465933f7e3D48C7Ca03C',
  dvpHelperAddress: '0x83096F52F2C20373C11ADa557FD87DA8Db2b150a',
  dvpAbi: DVP_ABI,
  dvpHelperAbi: DVP_HELPER_ABI,
  version: {
    tag: 'v1.0',
    name: 'Initial release',
    isDeprecated: false,
    deploymentDate: '2025-08-29',
  },
};

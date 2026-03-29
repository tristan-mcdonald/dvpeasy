import type { ContractConfig } from '../../types';
import { DVP_ABI } from '../../abis/dvp';
import { DVP_HELPER_ABI } from '../../abis/dvpHelper';

/**
 * Polygon Mainnet v1.0 contract configuration.
 */
export const config: ContractConfig = {
  networkId: 'polygon',
  dvpAddress: '0xFBdA0E404B429c878063b3252A2c2da14fe28e7f',
  dvpHelperAddress: '0x662E81BCfF1887C4F73f8086E9D0d590F85A7f1E',
  dvpAbi: DVP_ABI,
  dvpHelperAbi: DVP_HELPER_ABI,
  version: {
    tag: 'v1.0',
    name: 'Initial release',
    isDeprecated: false,
    deploymentDate: '2025-09-01',
  },
};

import type { ContractConfig } from '../../types';
import { DVP_ABI } from '../../abis/dvp';
import { DVP_HELPER_ABI } from '../../abis/dvpHelper';

/**
 * Sepolia v0.9 (Beta) contract configuration.
 */
export const config: ContractConfig = {
  networkId: 'sepolia',
  dvpAddress: '0xa725759CA0a2c18E59495dE1029b84261cD29B3f',
  dvpHelperAddress: '0x0C5c8941B6A07626713aD42e561BFBbC6636f82A',
  dvpAbi: DVP_ABI,
  dvpHelperAbi: DVP_HELPER_ABI,
  version: {
    tag: 'v0.9',
    name: 'Beta release',
    isDeprecated: true,
    deploymentDate: '2025-07-07',
  },
};

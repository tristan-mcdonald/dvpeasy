import type { ContractConfig } from '../../types';
import { DVP_ABI } from '../../abis/dvp';
import { DVP_HELPER_ABI } from '../../abis/dvpHelper';

/**
 * Sepolia v1.0 contract configuration.
 */
export const config: ContractConfig = {
  networkId: 'sepolia',
  dvpAddress: '0x0DB7eb1E62514625E03AdE35E60df74Fb8e4E36a',
  dvpHelperAddress: '0xE988E4A78DD4717C0E1f2182C257A459Fe06DF68',
  dvpAbi: DVP_ABI,
  dvpHelperAbi: DVP_HELPER_ABI,
  version: {
    tag: 'v1.0',
    name: 'Initial release',
    isDeprecated: false,
    deploymentDate: '2025-08-29',
  },
};

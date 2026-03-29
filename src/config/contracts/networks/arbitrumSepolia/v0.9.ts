import type { ContractConfig } from '../../types';
import { DVP_ABI } from '../../abis/dvp';
import { DVP_HELPER_ABI } from '../../abis/dvpHelper';

/**
 * Arbitrum Sepolia v0.9 (Beta) contract configuration.
 */
export const config: ContractConfig = {
  networkId: 'arbitrumSepolia',
  dvpAddress: '0x6c0231838Bf25AF1B3D1705A389358d2BaC09dE0',
  dvpHelperAddress: '0xaDc59f36fFedFA4821913679e57E66a9E34298DC',
  dvpAbi: DVP_ABI,
  dvpHelperAbi: DVP_HELPER_ABI,
  version: {
    tag: 'v0.9',
    name: 'Beta release',
    isDeprecated: true,
    deploymentDate: '2025-07-07',
  },
};

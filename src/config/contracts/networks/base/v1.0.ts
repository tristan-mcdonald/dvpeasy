import type { ContractConfig } from '../../types';
import { DVP_ABI } from '../../abis/dvp';
import { DVP_HELPER_ABI } from '../../abis/dvpHelper';

/**
 * Base Mainnet v1.0 contract configuration.
 * Source: https://github.com/KevinSmall/delivery-versus-payment
 */
export const config: ContractConfig = {
  networkId: 'base',
  dvpAddress: '0x70F1770C1FCafcd5B178f5EE586a54312718C9aF',
  dvpHelperAddress: '0xF78470AfBaA0b3D0079794787FF927919E42D50E',
  dvpAbi: DVP_ABI,
  dvpHelperAbi: DVP_HELPER_ABI,
  version: {
    tag: 'v1.0',
    name: 'Initial release',
    isDeprecated: false,
    deploymentDate: '2026-03-27',
  },
};

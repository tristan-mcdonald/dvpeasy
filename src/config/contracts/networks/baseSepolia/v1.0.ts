import type { ContractConfig } from '../../types';
import { DVP_ABI } from '../../abis/dvp';
import { DVP_HELPER_ABI } from '../../abis/dvpHelper';

/**
 * Base Sepolia v1.0 contract configuration.
 * Source: https://github.com/KevinSmall/delivery-versus-payment
 */
export const config: ContractConfig = {
  networkId: 'baseSepolia',
  dvpAddress: '0x12D5cF7A0de74F2B8810a5Fd2ec0D6B1AC2A9D0E',
  dvpHelperAddress: '0xA7785aD291fE4e277cBfa0205A2A3CEF70546490',
  dvpAbi: DVP_ABI,
  dvpHelperAbi: DVP_HELPER_ABI,
  version: {
    tag: 'v1.0',
    name: 'Initial release',
    isDeprecated: false,
    deploymentDate: '2026-03-27',
  },
};

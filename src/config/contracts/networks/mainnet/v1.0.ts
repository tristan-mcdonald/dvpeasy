import type { ContractConfig } from '../../types';
import { DVP_ABI } from '../../abis/dvp';
import { DVP_HELPER_ABI } from '../../abis/dvpHelper';

/**
 * Ethereum Mainnet v1.0 contract configuration.
 * Source: https://github.com/KevinSmall/delivery-versus-payment
 */
export const config: ContractConfig = {
  networkId: 'mainnet',
  dvpAddress: '0xb0d73b0559F260bc239FF2ffBc8676595601134c',
  dvpHelperAddress: '0x5de79c31355ABD1683e6f41aA75Bc535c56a6156',
  dvpAbi: DVP_ABI,
  dvpHelperAbi: DVP_HELPER_ABI,
  version: {
    tag: 'v1.0',
    name: 'Initial release',
    isDeprecated: false,
    deploymentDate: '2026-03-27',
  },
};

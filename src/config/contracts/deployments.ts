import type { Address } from 'viem';
import { NetworkId, networks } from '../networks';

export interface ContractVersion {
  tag: string;
  name: string;
  isDeprecated: boolean;
  /** The date of the deployment on chain, as `YYYY-MM-DD`. */
  deploymentDate: string;
}

export interface ContractDeployment {
  version: ContractVersion;
  dvpAddress: Address;
  dvpHelperAddress: Address;
}

interface NetworkDeployments {
  defaultVersion: string;
  /** Newest first, the order the version picker shows them in. */
  deployments: ContractDeployment[];
}

const INITIAL_RELEASE: ContractVersion = {
  tag: 'v1.0',
  name: 'Initial release',
  isDeprecated: false,
  deploymentDate: '2026-03-27',
};

/**
 * The DVP and helper contracts on each network. The v1.0 contracts are deployed from
 * https://github.com/KevinSmall/delivery-versus-payment.
 */
const DEPLOYMENTS: Record<NetworkId, NetworkDeployments> = {
  base: {
    defaultVersion: 'v1.0',
    deployments: [
      {
        version: INITIAL_RELEASE,
        dvpAddress: '0x70F1770C1FCafcd5B178f5EE586a54312718C9aF',
        dvpHelperAddress: '0xF78470AfBaA0b3D0079794787FF927919E42D50E',
      },
    ],
  },
  baseSepolia: {
    defaultVersion: 'v1.0',
    deployments: [
      {
        version: INITIAL_RELEASE,
        dvpAddress: '0x12D5cF7A0de74F2B8810a5Fd2ec0D6B1AC2A9D0E',
        dvpHelperAddress: '0xA7785aD291fE4e277cBfa0205A2A3CEF70546490',
      },
    ],
  },
  mainnet: {
    defaultVersion: 'v1.0',
    deployments: [
      {
        version: INITIAL_RELEASE,
        dvpAddress: '0xb0d73b0559F260bc239FF2ffBc8676595601134c',
        dvpHelperAddress: '0x5de79c31355ABD1683e6f41aA75Bc535c56a6156',
      },
    ],
  },
  sepolia: {
    defaultVersion: 'v1.0',
    deployments: [
      {
        version: INITIAL_RELEASE,
        dvpAddress: '0x0270Eca05754e19Ca0321a0A29A8C0e75409A8BD',
        dvpHelperAddress: '0x25B3c1ba1C2e38c7C0978F3A43D2D7ab59Beca2d',
      },
      {
        version: {
          tag: 'v0.9',
          name: 'Beta release',
          isDeprecated: true,
          deploymentDate: '2025-07-07',
        },
        dvpAddress: '0xa725759CA0a2c18E59495dE1029b84261cD29B3f',
        dvpHelperAddress: '0x0C5c8941B6A07626713aD42e561BFBbC6636f82A',
      },
    ],
  },
};

/**
 * Lookups of the contract deployments. Network IDs may be any string, such as from a URL; one
 * which isn't a network has no deployments.
 */
export const contracts = {
  defaultVersion (networkId: NetworkId): string {
    return DEPLOYMENTS[networkId].defaultVersion;
  },

  deployment (networkId: string, version: string): ContractDeployment | undefined {
    return contracts.deployments(networkId).find(deployment => deployment.version.tag === version);
  },

  deployments (networkId: string): ContractDeployment[] {
    const network = networks.byId(networkId);
    return network ? DEPLOYMENTS[network.id].deployments : [];
  },
};

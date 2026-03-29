import { Address } from 'viem';
import type { DvpAbi, DvpHelperAbi } from './abis';

/**
 * Contract version metadata.
 */
export interface ContractVersion {
  tag: string; // e.g., "v1.0", "v1.1", "v2.0"
  name: string; // e.g., "Initial Release", "Gas Optimized"
  isDeprecated: boolean;
  deploymentDate: string; // ISO date string of actual blockchain deployment
}

/**
 * Contract configuration interface focused on contract-specific data.
 */
export interface ContractConfig {
  networkId: string; // References a key in the NETWORKS object.
  dvpAddress: Address;
  dvpHelperAddress: Address;
  dvpAbi: DvpAbi;
  dvpHelperAbi: DvpHelperAbi;
  version: ContractVersion;
}

/**
 * Collection of contract configs for different versions on a network.
 */
export interface NetworkContractVersions {
  networkId: string;
  versions: Record<string, ContractConfig>; // version string -> config
  defaultVersion: string; // version string to use as default
}

/**
 * Extended contract configuration with network metadata.
 */
export interface ContractConfigWithNetwork extends ContractConfig {
  name: string;
  chainId: number;
  iconUrl: string | null;
}

/**
 * Extended contract configuration with network metadata.
 */
export interface VersionedContractConfigWithNetwork extends ContractConfig {
  name: string;
  chainId: number;
  iconUrl: string | null;
}

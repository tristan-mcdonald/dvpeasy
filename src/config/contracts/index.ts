import { contractConfigManager } from './manager';

export type { ContractConfigWithNetwork } from './manager';
export { contractConfigManager };
export const publicClient = contractConfigManager.getPublicClient();

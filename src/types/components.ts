import { Flow, Settlement, SettlementWithFlows } from './settlement';

export interface SettlementRowProps {
  settlement: Settlement | SettlementWithFlows;
}

export interface TokensDisplayProps {
  flows: Flow[];
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  chainId: number;
  isLoading: boolean;
  isNFT: boolean;
  logoUrl?: string;
  trustWalletLogoUrl?: string;
}

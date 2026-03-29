import { Flow } from './settlement';
import { Settlement } from './settlement';
import { SettlementWithFlows } from '../hooks/useSettlementsWithFlows';

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

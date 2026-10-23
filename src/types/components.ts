import { Flow, Settlement, SettlementWithFlows } from './settlement';

export interface SettlementRowProps {
  settlement: Settlement | SettlementWithFlows;
}

export interface TokensDisplayProps {
  flows: Flow[];
}

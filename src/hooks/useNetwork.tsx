import { useContext } from 'react';
import { NetworkContext, NetworkContextValue } from '../contexts/NetworkContext';

/**
 * Hook to access the unified network context.
 */
export function useNetwork (): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

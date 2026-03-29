import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// State interface.
export interface DashboardState {
  // Filter state.
  tokenFilter: string;
  settlementIdFilter: string;
  walletFilter: boolean;

  // UI state.
  isDrawerOpen: boolean;

  // Pagination state.
  currentPage: number;
  settlementsPerPage: number;
}

// Derived state interface.
export interface DashboardDerivedState {
  isTokenFiltering: boolean;
  isSettlementIdFiltering: boolean;
  isWalletFiltering: boolean;
  hasActiveFilters: boolean;
}

// Action types.
type DashboardAction =
  | { type: 'SET_TOKEN_FILTER'; payload: string }
  | { type: 'SET_SETTLEMENT_ID_FILTER'; payload: string }
  | { type: 'SET_WALLET_FILTER'; payload: boolean }
  | { type: 'CLEAR_TOKEN_FILTER' }
  | { type: 'CLEAR_SETTLEMENT_ID_FILTER' }
  | { type: 'CLEAR_WALLET_FILTER' }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_DRAWER_OPEN'; payload: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'RESET_TO_FIRST_PAGE' }
  | { type: 'SYNC_FROM_URL'; payload: Partial<DashboardState> };

// Initial state.
const initialState: DashboardState = {
  tokenFilter: '',
  settlementIdFilter: '',
  walletFilter: false,
  isDrawerOpen: false,
  currentPage: 1,
  settlementsPerPage: 20,
};

// Reducer function.
function dashboardReducer (state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_TOKEN_FILTER':
      return { ...state, tokenFilter: action.payload, currentPage: 1 };

    case 'SET_SETTLEMENT_ID_FILTER':
      return { ...state, settlementIdFilter: action.payload, currentPage: 1 };

    case 'SET_WALLET_FILTER':
      return { ...state, walletFilter: action.payload, currentPage: 1 };

    case 'CLEAR_TOKEN_FILTER':
      return { ...state, tokenFilter: '', currentPage: 1 };

    case 'CLEAR_SETTLEMENT_ID_FILTER':
      return { ...state, settlementIdFilter: '', currentPage: 1 };

    case 'CLEAR_WALLET_FILTER':
      return { ...state, walletFilter: false, currentPage: 1 };

    case 'CLEAR_ALL_FILTERS':
      return {
        ...state,
        tokenFilter: '',
        settlementIdFilter: '',
        walletFilter: false,
        currentPage: 1,
      };

    case 'SET_DRAWER_OPEN':
      return { ...state, isDrawerOpen: action.payload };

    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };

    case 'RESET_TO_FIRST_PAGE':
      return { ...state, currentPage: 1 };

    case 'SYNC_FROM_URL':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// Main hook interface.
export interface UseDashboardState {
  // State.
  state: DashboardState;
  derived: DashboardDerivedState;

  // Filter actions.
  setTokenFilter: (value: string) => void;
  setSettlementIdFilter: (value: string) => void;
  setWalletFilter: (value: boolean) => void;
  clearTokenFilter: () => void;
  clearSettlementIdFilter: () => void;
  clearWalletFilter: () => void;
  clearAllFilters: () => void;

  // UI actions.
  setDrawerOpen: (isOpen: boolean) => void;
  toggleDrawer: () => void;

  // Pagination actions.
  handlePageChange: (newPage: number) => void;
  resetToFirstPage: () => void;
  getPaginatedData: <T>(data: T[]) => {
    currentData: T[];
    totalPages: number;
    validCurrentPage: number;
  };
}

export function useDashboardState (): UseDashboardState {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const lastUrlPage = useRef<string | null>(null);

  // Sync state with URL when URL changes (mount, browser navigation, etc).
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const pageFromUrl = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

    // Only update state if URL page is different from what we last set.
    if (pageParam !== lastUrlPage.current && pageFromUrl !== state.currentPage) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: pageFromUrl });
    }
  }, [searchParams, state.currentPage]);

  // Update URL when state.currentPage changes.
  useEffect(() => {
    const expectedPageParam = state.currentPage === 1 ? null : state.currentPage.toString();

    // Track what we're setting to avoid re-syncing from URL.
    lastUrlPage.current = expectedPageParam;

    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (state.currentPage === 1) {
        newParams.delete('page');
      } else {
        newParams.set('page', state.currentPage.toString());
      }
      return newParams;
    }, { replace: true });
  }, [state.currentPage, setSearchParams]);

  // Derived state calculations.
  const derived = useMemo((): DashboardDerivedState => {
    const isTokenFiltering = state.tokenFilter.trim() !== '';
    const isSettlementIdFiltering = state.settlementIdFilter.trim() !== '';
    const isWalletFiltering = state.walletFilter;
    const hasActiveFilters = isTokenFiltering || isSettlementIdFiltering || isWalletFiltering;

    return {
      isTokenFiltering,
      isSettlementIdFiltering,
      isWalletFiltering,
      hasActiveFilters,
    };
  }, [state.tokenFilter, state.settlementIdFilter, state.walletFilter]);

  // Action creators.
  const setTokenFilter = useCallback((value: string) => {
    dispatch({ type: 'SET_TOKEN_FILTER', payload: value });
  }, []);

  const setSettlementIdFilter = useCallback((value: string) => {
    dispatch({ type: 'SET_SETTLEMENT_ID_FILTER', payload: value });
  }, []);

  const setWalletFilter = useCallback((value: boolean) => {
    dispatch({ type: 'SET_WALLET_FILTER', payload: value });
  }, []);

  const clearTokenFilter = useCallback(() => {
    dispatch({ type: 'CLEAR_TOKEN_FILTER' });
  }, []);

  const clearSettlementIdFilter = useCallback(() => {
    dispatch({ type: 'CLEAR_SETTLEMENT_ID_FILTER' });
  }, []);

  const clearWalletFilter = useCallback(() => {
    dispatch({ type: 'CLEAR_WALLET_FILTER' });
  }, []);

  const clearAllFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }, []);

  const setDrawerOpen = useCallback((isOpen: boolean) => {
    dispatch({ type: 'SET_DRAWER_OPEN', payload: isOpen });
  }, []);

  const toggleDrawer = useCallback(() => {
    dispatch({ type: 'SET_DRAWER_OPEN', payload: !state.isDrawerOpen });
  }, [state.isDrawerOpen]);

  const handlePageChange = useCallback((newPage: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: newPage });
  }, []);

  const resetToFirstPage = useCallback(() => {
    dispatch({ type: 'RESET_TO_FIRST_PAGE' });
  }, []);

  // Pagination helper.
  const getPaginatedData = useCallback(<T>(data: T[]) => {
    const totalPages = Math.ceil(data.length / state.settlementsPerPage);
    const validCurrentPage = totalPages > 0 && state.currentPage > totalPages ? 1 : state.currentPage;

    const indexOfLast = validCurrentPage * state.settlementsPerPage;
    const indexOfFirst = indexOfLast - state.settlementsPerPage;
    const currentData = data.slice(indexOfFirst, indexOfLast);

    return {
      currentData,
      totalPages,
      validCurrentPage,
    };
  }, [state.currentPage, state.settlementsPerPage]);

  return {
    state,
    derived,
    setTokenFilter,
    setSettlementIdFilter,
    setWalletFilter,
    clearTokenFilter,
    clearSettlementIdFilter,
    clearWalletFilter,
    clearAllFilters,
    setDrawerOpen,
    toggleDrawer,
    handlePageChange,
    resetToFirstPage,
    getPaginatedData,
  };
}

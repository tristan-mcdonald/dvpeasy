import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface DashboardState {
  tokenFilter: string;
  settlementIdFilter: string;
  walletFilter: boolean;

  isDrawerOpen: boolean;

  currentPage: number;
  settlementsPerPage: number;
}

export interface DashboardDerivedState {
  isTokenFiltering: boolean;
  isSettlementIdFiltering: boolean;
  isWalletFiltering: boolean;
  hasActiveFilters: boolean;
}

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

const initialState: DashboardState = {
  tokenFilter: '',
  settlementIdFilter: '',
  walletFilter: false,
  isDrawerOpen: false,
  currentPage: 1,
  settlementsPerPage: 20,
};

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

export interface UseDashboardState {
  state: DashboardState;
  derived: DashboardDerivedState;

  setTokenFilter: (value: string) => void;
  setSettlementIdFilter: (value: string) => void;
  setWalletFilter: (value: boolean) => void;
  clearTokenFilter: () => void;
  clearSettlementIdFilter: () => void;
  clearWalletFilter: () => void;
  clearAllFilters: () => void;

  setDrawerOpen: (isOpen: boolean) => void;
  toggleDrawer: () => void;

  handlePageChange: (newPage: number) => void;
  resetToFirstPage: () => void;
  getPaginatedData: <T>(data: T[]) => {
    currentData: T[];
    totalPages: number;
    validCurrentPage: number;
  };
}

/**
 * The dashboard's filters, its filter drawer and its page, which is kept in the URL as `?page=`.
 */
export function useDashboardState (): UseDashboardState {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const lastUrlPage = useRef<string | null>(null);

  // When the URL's page changes from outside, such as by going back, the state follows it.
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const pageFromUrl = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

    // The page this hook itself last wrote to the URL is skipped.
    if (pageParam !== lastUrlPage.current && pageFromUrl !== state.currentPage) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: pageFromUrl });
    }
  }, [searchParams, state.currentPage]);

  // The page goes into the URL, except for the first.
  useEffect(() => {
    const expectedPageParam = state.currentPage === 1 ? null : state.currentPage.toString();

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

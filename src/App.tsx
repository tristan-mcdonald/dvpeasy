import ErrorBoundary from './components/ErrorBoundary';
import FooterGlobal from './components/FooterGlobal';
import HeaderGlobal from './components/HeaderGlobal';
import NetworkWrapper from './components/NetworkWrapper';
import PageSuspense from './components/PageSuspense';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { config } from './config/wagmi';
import { IStaticMethods } from 'flyonui/flyonui';
import { lazy } from 'react';
import { logger } from './lib/logger';
import { NetworkProvider } from './contexts/NetworkContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RedirectToDefaultCreate, RedirectToDefaultDashboard, RedirectToDefaultSettlement } from './components/RedirectHelpers';
import { toastColors } from './config/theme';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useSettlementCacheManager } from './hooks/useSettlementCacheManager';
import { WagmiProvider } from 'wagmi';

// Lazy load page components for better code splitting.
const CreateSettlement = lazy(() => import('./pages/CreateSettlement'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Error404 = lazy(() => import('./pages/Error404'));
const Help = lazy(() => import('./pages/Help'));
const SettlementDetails = lazy(() => import('./pages/SettlementDetails'));

// Declare global interface for HSStaticMethods.
declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5000,
    },
  },
});



function AppContent () {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize settlement cache manager.
  useSettlementCacheManager();

  /**
   * Handle GitHub Pages SPA routing.
   */
  useEffect(() => {
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      navigate(redirect, { replace: true });
    }
  }, [navigate]);

  /**
   * Initialize FlyonUI components on route change.
   */
  useEffect(() => {
    const loadFlyonui = async () => {
      try {
        await import('flyonui/flyonui');
        // Auto-initialize all FlyonUI components.
        if (window.HSStaticMethods && typeof window.HSStaticMethods.autoInit === 'function') {
          window.HSStaticMethods.autoInit();
        }
      } catch (error) {
        logger.error('Failed to load FlyonUI:', error);
      }
    };
    loadFlyonui();
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <ErrorBoundary
      description="The application encountered an unexpected error. Please refresh the page or try again."
      showDetails={false}
      title="Application Error">
        <HeaderGlobal />
      </ErrorBoundary>

      <main className="flex-1 flex flex-col container mx-auto py-6">
        <Routes>
          {/* Bare route redirects to default network/version */}
          <Route path="/" element={<RedirectToDefaultDashboard />} />
          <Route path="/create" element={<RedirectToDefaultCreate />} />
          <Route path="/settlement/:id" element={<RedirectToDefaultSettlement />} />

          {/* Network-scoped routes */}
          <Route path="/:network/:version" element={<NetworkWrapper />}>

            {/* Dashboard at index */}
            <Route
            index
            element={
              <PageSuspense>
                <RouteErrorBoundary routeName="Dashboard">
                  <Dashboard />
                </RouteErrorBoundary>
              </PageSuspense>
            } />

            {/* Create settlement */}
            <Route
            path="create"
            element={
              <PageSuspense>
                <RouteErrorBoundary routeName="Create Settlement">
                  <CreateSettlement />
                </RouteErrorBoundary>
              </PageSuspense>
            } />

            {/* Settlement details */}
            <Route
            path="settlement/:settlementId"
            element={
              <PageSuspense>
                <RouteErrorBoundary routeName="Settlement Details">
                  <SettlementDetails />
                </RouteErrorBoundary>
              </PageSuspense>
            } />

            {/* Help page */}
            <Route
            path="help"
            element={
              <PageSuspense>
                <RouteErrorBoundary routeName="Help">
                  <Help />
                </RouteErrorBoundary>
              </PageSuspense>
            } />

            {/* 404 for unknown paths under valid network/version */}
            <Route
            path="*"
            element={
              <PageSuspense>
                <RouteErrorBoundary routeName="404">
                  <Error404 />
                </RouteErrorBoundary>
              </PageSuspense>
            } />
          </Route>

          {/* Global 404 for everything else */}
          <Route
          path="*"
          element={
            <PageSuspense>
              <RouteErrorBoundary routeName="404">
                <Error404 />
              </RouteErrorBoundary>
            </PageSuspense>
          } />
        </Routes>
      </main>

      <ErrorBoundary
      description="The footer encountered an error but the main application is still functional."
      showRetryButton={true}
      title="Footer error">
        <FooterGlobal />
      </ErrorBoundary>
    </div>
  );
}

function App () {
  return (
    <ErrorBoundary
    description="The application failed to initialize. This may be due to network connectivity or configuration issues."
    showDetails={import.meta.env.DEV}
    title="Critical application error">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary
          description="There was an error with data management. Please refresh the page."
          showRetryButton={true}
          title="React query error">
            <Router>
              <ErrorBoundary
              description="There was an error with page navigation. Please refresh the page."
              showRetryButton={true}
              title="Router error">
                <NetworkProvider>
                  <AppContent />
                </NetworkProvider>
              </ErrorBoundary>
              <Toaster
              position="top-right"
              toastOptions={{
                duration: 6000,
                style: {
                  border: toastColors.border,
                  background: toastColors.background,
                  color: toastColors.text,
                },
                success: {
                  iconTheme: {
                    primary: toastColors.success.primary,
                    secondary: toastColors.success.secondary,
                  },
                  style: {
                    border: toastColors.success.border,
                  },
                },
                error: {
                  iconTheme: {
                    primary: toastColors.error.primary,
                    secondary: toastColors.error.secondary,
                  },
                  style: {
                    border: toastColors.error.border,
                  },
                },
              }}/>
            </Router>
          </ErrorBoundary>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}

export default App;

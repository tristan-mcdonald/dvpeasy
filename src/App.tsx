import ErrorBoundary from './components/ErrorBoundary';
import FooterGlobal from './components/FooterGlobal';
import HeaderGlobal from './components/HeaderGlobal';
import NetworkWrapper from './components/NetworkWrapper';
import PageSuspense from './components/PageSuspense';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { config } from './config/wagmi';
import { ContractError } from './types/errors';
import { hashFn } from 'wagmi/query';
import { IStaticMethods } from 'flyonui/flyonui';
import { lazy } from 'react';
import { logger } from './lib/logger';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RedirectToDefaultCreate, RedirectToDefaultDashboard, RedirectToDefaultSettlement } from './components/RedirectHelpers';
import { toastColors } from './config/theme';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';

// Each page's code is loaded when it's first opened.
const CreateSettlement = lazy(() => import('./pages/CreateSettlement'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Error404 = lazy(() => import('./pages/Error404'));
const Help = lazy(() => import('./pages/Help'));
const SettlementDetails = lazy(() => import('./pages/SettlementDetails'));

// FlyonUI's script adds `HSStaticMethods` to `window`.
declare global {
  interface Window {
    HSStaticMethods: IStaticMethods;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Hashes bigints in query keys, as wagmi's own queries do.
      queryKeyHashFn: hashFn,
      retry: (failureCount, error) => (
        failureCount < 2 && !(error instanceof ContractError && !error.isRetryable)
      ),
      staleTime: 5000,
    },
  },
});



function AppContent () {
  const location = useLocation();
  const navigate = useNavigate();

  // GitHub Pages serves `public/404.html` for a path it doesn't have, which sends the browser to `/`
  // with the path in the query string. `index.html` saves the path, and this goes back to it.
  useEffect(() => {
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      navigate(redirect, { replace: true });
    }
  }, [navigate]);

  // FlyonUI sets up the components in the page's markup, so it runs again on each page.
  useEffect(() => {
    const loadFlyonui = async () => {
      try {
        await import('flyonui/flyonui');
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
          <Route path="/" element={<RedirectToDefaultDashboard />} />
          <Route path="/create" element={<RedirectToDefaultCreate />} />
          <Route path="/settlement/:id" element={<RedirectToDefaultSettlement />} />

          <Route path="/:network/:version" element={<NetworkWrapper />}>

            <Route
            index
            element={
              <PageSuspense>
                <RouteErrorBoundary routeName="Dashboard">
                  <Dashboard />
                </RouteErrorBoundary>
              </PageSuspense>
            } />

            <Route
            path="create"
            element={
              <PageSuspense>
                <RouteErrorBoundary routeName="Create Settlement">
                  <CreateSettlement />
                </RouteErrorBoundary>
              </PageSuspense>
            } />

            <Route
            path="settlement/:settlementId"
            element={
              <PageSuspense>
                <RouteErrorBoundary routeName="Settlement Details">
                  <SettlementDetails />
                </RouteErrorBoundary>
              </PageSuspense>
            } />

            <Route
            path="help"
            element={
              <PageSuspense>
                <RouteErrorBoundary routeName="Help">
                  <Help />
                </RouteErrorBoundary>
              </PageSuspense>
            } />

            {/* An unknown page on a valid network and version. */}
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

          {/* Any other path. */}
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

/**
 * The app: its providers, routes, header, footer and toasts.
 */
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
                <AppContent />
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

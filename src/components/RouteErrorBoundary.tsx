import ErrorBoundary from './ErrorBoundary';
import HeaderLocal from './HeaderLocal';
import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../lib/logger';
import { useLocation } from 'react-router-dom';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  routeName?: string;
}

interface RouteErrorInfo {
  pathname: string;
  search: string;
  routeName?: string;
}

/**
 * Route-specific error boundary that provides navigation-aware error recovery.
 * Includes route context in error logging and offers route-specific recovery options.
 */
// eslint-disable-next-line react-refresh/only-export-components
function RouteErrorBoundaryContent ({ children, routeName }: RouteErrorBoundaryProps) {
  const location = useLocation();
  const getCurrentRoute = (): RouteErrorInfo => ({
    pathname: location.pathname,
    search: location.search,
  });

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    const routeInfo = getCurrentRoute();

    logger.error(`Route Error Boundary caught error in ${routeName || routeInfo.pathname}`, {
      error: error.message,
      route: routeInfo.pathname,
      search: routeInfo.search,
      routeName,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  const routeSpecificFallback = (
    <HeaderLocal
    centerVertically={true}
    description={`${routeName ? `The ${routeName} page` : 'This page'} encountered an error and couldn't be displayed.`}
    title="Page error" />
  );

  return (
    <ErrorBoundary
    fallback={routeSpecificFallback}
    onError={handleError}
    showRetryButton={false}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Class-based wrapper to handle the router hooks limitation in class components.
 */
export default class RouteErrorBoundary extends Component<RouteErrorBoundaryProps> {
  render () {
    return (
      <RouteErrorBoundaryContent {...this.props}>
        {this.props.children}
      </RouteErrorBoundaryContent>
    );
  }
}

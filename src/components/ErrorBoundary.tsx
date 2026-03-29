import ButtonLink from './ButtonLink';
import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../lib/logger';
import { urlManager } from '../lib/url-manager';
import { RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  showRetryButton?: boolean;
  title?: string;
  description?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

const MAX_RETRY_COUNT = 3;

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree.
 * Provides a fallback UI, error recovery mechanisms, and integrates with the logging system.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor (props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError (error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch (error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log the error with context.
    logger.error('Error Boundary caught an error', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
    });

    // Call optional onError callback.
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset the error boundary state to retry rendering.
   */
  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount <= MAX_RETRY_COUNT) {
      logger.info(`Error Boundary retry attempt ${newRetryCount}/${MAX_RETRY_COUNT}`);
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: newRetryCount,
      });
    } else {
      logger.warn('Error Boundary max retry count reached');
    }
  };

  /**
   * Refresh the entire page.
   */
  handleRefresh = () => {
    logger.info('Error Boundary triggered page refresh');
    window.location.reload();
  };

  /**
   * Navigate to home page.
   */
  handleGoHome = () => {
    logger.info('Error Boundary triggered navigation to home');
    const { networkId, version } = urlManager.defaultNetworkAndVersion();
    window.location.href = `/${networkId}/${version}`;
  };

  render () {
    if (this.state.hasError) {
      // Use custom fallback if provided.
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const {
        title = 'Something went wrong',
        description = 'An unexpected error occurred. Please try again or refresh the page.',
        showDetails = import.meta.env.DEV,
        showRetryButton = true,
      } = this.props;

      const canRetry = this.state.retryCount < MAX_RETRY_COUNT;

      return (
        <header className="flex flex-col justify-center items-center my-auto text-center">
          <h1>{title}</h1>
          <p className="mt-2 text-lg text-text-label">{description}</p>
          {showDetails && this.state.error && (
            <>
              <p className="mt-2 max-w-4xl text-left">{this.state.error.message}</p>
              {this.state.error.stack && (
                <p className="mt-2 max-w-4xl text-left">{this.state.error.stack}</p>
              )}
            </>
          )}
          {showRetryButton && canRetry && (
            <ButtonLink
            as="button"
            className="mt-4"
            icon={<RotateCcw className="size-4" />}
            onClick={this.handleRetry}
            variant="primary">Try again ({MAX_RETRY_COUNT - this.state.retryCount} attempts left)</ButtonLink>
          )}
          {this.state.retryCount >= MAX_RETRY_COUNT && (
            <p>Maximum retry attempts reached. Try refreshing the page.</p>
          )}
        </header>
      );
    }

    return this.props.children;
  }
}

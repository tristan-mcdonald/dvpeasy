import { ReactNode, Suspense } from 'react';

interface PageSuspenseProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Provides consistent loading state for lazy-loaded page components.
 */
function PageLoadingFallback () {
  return (
    <div className="flex flex-col items-center justify-center mt-auto mb-auto min-h-[50vh]">
      <div className="loading loading-spinner text-primary mb-6"></div>
      <p className="text-text-label">Loading page…</p>
    </div>
  );
}

/**
 * Wrapper component that provides Suspense boundary with consistent loading UI.
 */
export default function PageSuspense ({ children, fallback }: PageSuspenseProps) {
  return (
    <Suspense fallback={fallback || <PageLoadingFallback />}>
      {children}
    </Suspense>
  );
}

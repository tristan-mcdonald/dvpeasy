import { ReactNode, Suspense } from 'react';

interface PageSuspenseProps {
  children: ReactNode
  fallback?: ReactNode
}

function PageLoadingFallback () {
  return (
    <div className="flex flex-col items-center justify-center mt-auto mb-auto min-h-[50vh]">
      <div className="loading loading-spinner text-primary mb-6"></div>
      <p className="text-text-label">Loading page…</p>
    </div>
  );
}

/**
 * Shows a loading message while a page's code, which is loaded only when it's needed, arrives.
 */
export default function PageSuspense ({ children, fallback }: PageSuspenseProps) {
  return (
    <Suspense fallback={fallback || <PageLoadingFallback />}>
      {children}
    </Suspense>
  );
}

import { LayoutDashboard, Plus } from 'lucide-react';

/**
 * The header's links, each with how to tell whether it's the current page.
 */
export function getNavigationItems (dashboardPath: string, createPath: string) {
  return [
    {
      to: dashboardPath,
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActivePathPredicate: (currentPath: string) => {
        // The dashboard is `/{network}/{version}`.
        const dashboardPattern = /^\/[^/]+\/[^/]+$/;
        return currentPath === '/' || dashboardPattern.test(currentPath);
      },
    },
    {
      to: createPath,
      label: 'Create settlement',
      icon: Plus,
      isActivePathPredicate: (currentPath: string) => {
        return currentPath.includes('/settlement/') && currentPath.endsWith('/create');
      },
    },
  ] as const;
}

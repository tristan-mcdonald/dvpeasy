import { LayoutDashboard, Plus } from 'lucide-react';

/**
 * Navigation configuration for the main application navigation.
 * @param dashboardPath - The dashboard path with current network/version.
 * @param createPath - The create settlement path with current network/version.
 */
export function getNavigationItems (dashboardPath: string, createPath: string) {
  return [
    {
      to: dashboardPath,
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActivePathPredicate: (currentPath: string) => {
        // Match dashboard paths with network/version pattern.
        const dashboardPattern = /^\/[^/]+\/[^/]+$/;
        return currentPath === '/' || dashboardPattern.test(currentPath);
      },
    },
    {
      to: createPath,
      label: 'Create settlement',
      icon: Plus,
      isActivePathPredicate: (currentPath: string) => {
        // Match create settlement paths.
        return currentPath.includes('/settlement/') && currentPath.endsWith('/create');
      },
    },
  ] as const;
}

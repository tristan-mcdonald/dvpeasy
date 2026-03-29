import ButtonLink from '../components/ButtonLink';
import HeaderLocal from '../components/HeaderLocal';
import { LayoutDashboard } from 'lucide-react';
import { useCurrentNetworkPath } from '../hooks/useCurrentNetworkPath';

/**
 * 404 error page component displayed when users navigate to invalid routes.
 * Provides a user-friendly error message and navigation back to the dashboard.
 */
export default function Error404 () {
  const currentDashboardPath = useCurrentNetworkPath();

  return (
    <HeaderLocal
    centerVertically={true}
    title="Page not found"
    description="The page you're looking for doesn't exist, or has been moved">
      <ButtonLink
      as="link"
      className="mt-6"
      icon={<LayoutDashboard className="size-4" />}
      to={currentDashboardPath}
      variant="primary">Return to Dashboard</ButtonLink>
    </HeaderLocal>
  );
}

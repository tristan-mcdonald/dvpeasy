import ButtonLink from '../components/ButtonLink';
import HeaderLocal from '../components/HeaderLocal';
import { LayoutDashboard } from 'lucide-react';
import { useCurrentNetworkPath } from '../hooks/useCurrentNetworkPath';

/**
 * The page for a path which doesn't exist, with a link back to the dashboard.
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

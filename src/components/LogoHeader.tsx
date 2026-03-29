import LogoDVP from './LogoDVP';
import { Link } from 'react-router-dom';

interface LogoHeaderProps {
  className?: string;
  size?: 'default' | 'mobile';
  to?: string;
}

/**
 * Reusable logo component for header sections with consistent sizing and link behavior.
 */
export default function LogoHeader ({
  className = 'text-xl',
  size = 'default',
  to = '/',
}: LogoHeaderProps) {
  const logoClasses = size === 'mobile' ? 'h-10 w-auto' : 'h-10 lg:h-12 2xl:h-14 w-auto';

  return (
    <Link
      className={className}
      title="DVPeasy"
      to={to}>
      <LogoDVP className={logoClasses} />
    </Link>
  );
}

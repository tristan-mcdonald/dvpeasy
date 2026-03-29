import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface NavigationLinkProps {
  to: string;
  icon: LucideIcon;
  children: ReactNode;
  isActivePathPredicate?: (currentPath: string) => boolean;
  variant?: 'desktop' | 'mobile';
}

/**
 * Reusable navigation link component with consistent aria-current handling and styling variants.
 */
export default function NavigationLink ({
  to,
  icon: Icon,
  children,
  isActivePathPredicate,
  variant = 'desktop',
}: NavigationLinkProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = isActivePathPredicate ? isActivePathPredicate(currentPath) : currentPath === to;

  const desktopClasses = 'flex items-center gap-0.5 py-[1.7rem] px-6 text-primary text-lg shadow-[inset_0_0_var(--color-primary)] hover:shadow-[inset_0_-3px_var(--color-primary)] transition-shadow duration-200 ease-in-out aria-[current]:text-attention aria-[current]:shadow-[inset_0_-3px_var(--color-interface-border)]';

  const mobileClasses = 'flex items-center gap-3 text-primary text-lg transition-colors aria-[current=page]:text-attention';

  const className = variant === 'desktop' ? desktopClasses : mobileClasses;

  return (
    <Link
      className={className}
      {...(isActive && { 'aria-current': 'page' })}
      to={to}>
      <Icon className={variant === 'desktop' ? 'size-5 shrink-0 me-2' : 'size-5 shrink-0'} />
      {variant === 'mobile' ? (
        <span className="link link-animated link-primary">{children}</span>
      ) : (
        <span>{children}</span>
      )}
    </Link>
  );
}

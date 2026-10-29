import { ReactNode } from 'react';

interface HeaderLocalProps {
  title: string;
  description?: string;
  children?: ReactNode;
  centerVertically?: boolean;
}

/**
 * A page's heading, with an optional description under it.
 */
export default function HeaderLocal ({ title, description, children, centerVertically = false }: HeaderLocalProps) {
  const headerClasses = centerVertically
    ? 'flex flex-col justify-center items-center my-auto text-center'
    : 'mt-6 mb-8 text-center';

  return (
    <header className={headerClasses}>
      <h1>{title}</h1>
      {description && <p className="mt-2 text-lg text-text-label">{description}</p>}
      {children}
    </header>
  );
}

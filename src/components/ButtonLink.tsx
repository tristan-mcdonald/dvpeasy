import { ReactNode } from 'react';

import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonLinkBaseProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
}

interface ButtonLinkAsButtonProps extends ButtonLinkBaseProps {
  as: 'button';
  onClick: () => void;
  type?: 'button' | 'submit' | 'reset';
}

interface ButtonLinkAsLinkProps extends ButtonLinkBaseProps {
  as: 'link';
  to: string;
}

interface ButtonLinkAsExternalLinkProps extends ButtonLinkBaseProps {
  as: 'link';
  href: string;
  target?: string;
}

type ButtonLinkProps = ButtonLinkAsButtonProps | ButtonLinkAsLinkProps | ButtonLinkAsExternalLinkProps;

export default function ButtonLink (props: ButtonLinkProps) {
  const {
    children,
    className = '',
    disabled = false,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    icon,
  } = props;

  const variantClasses = {
    primary: 'btn btn-gradient btn-primary',
    secondary: 'btn btn-soft btn-primary',
    outline: 'transition cursor-pointer flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-primary-subtle hover:border-primary bg-card-background hover:bg-white py-3 text-primary hover:text-primary-interaction',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  const widthClass = fullWidth ? 'btn-block' : '';

  const disabledClass = disabled ? 'btn-disabled' : '';

  const buttonClass = `${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`;

  if (props.as === 'link') {
    // Check whether it's an external link with `href`, or internal link with `to`.
    if ('href' in props) {
      return (
        // Render an external link.
        <a
        className={buttonClass}
        href={props.href}
        target={props.target}
        rel={props.target === '_blank' ? 'noopener noreferrer' : undefined}>
          {icon && icon}
          {children}
        </a>
      );
    } else {
      return (
        // Render an internal link.
        <Link
        className={buttonClass}
        to={props.to}>
          {icon && icon}
          {children}
        </Link>
      );
    }
  } else {
    return (
      // Render a button.
      <button
      className={buttonClass}
      disabled={disabled}
      onClick={props.onClick}
      type={props.type || 'button'}>
        {icon && icon}
        {children}
      </button>
    );
  }
}

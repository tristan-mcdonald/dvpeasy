import { FC, ReactNode } from 'react';

interface LabelWithIconProps {
  icon: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

export const LabelWithIcon: FC<LabelWithIconProps> = ({
  icon,
  children,
  htmlFor,
  className = '',
}) => {
  return (
    <label className={`block label mb-1 ${className}`} htmlFor={htmlFor}>
      <div className="flex items-center gap-2">
        <span className="flex-shrink-0 text-text-label">
          {icon}
        </span>
        <span>{children}</span>
      </div>
    </label>
  );
};

export default LabelWithIcon;

import { Coins } from 'lucide-react';
import { memo } from 'react';
import { TokenSizeVariant, getTokenSizeClasses } from '../utils/tokenSizeUtils';

/**
 * Props for the CustomTokenIcon component.
 */
interface CustomTokenIconProps {
  /** Size variant for the icon - defaults to 'sm' */
  size?: TokenSizeVariant;
}

/**
 * CustomTokenIcon component for displaying a generic token icon.
 * Used as a fallback when no specific token logo is available.
 *
 * Features:
 * - Consistent sizing with other token components
 * - Primary color background with white coins icon
 * - Memoized for performance optimization
 *
 * @param props - Component props
 * @returns JSX element representing a generic token icon
 *
 * @example
 * ```tsx
 * <CustomTokenIcon size="md" />
 * ```
 */
export const CustomTokenIcon = memo<CustomTokenIconProps>(({ size = 'sm' }) => {
  const { container, icon } = getTokenSizeClasses(size);

  return (
    <div className={`${container} bg-attention-subtle rounded-full flex items-center justify-center`}>
      <Coins className={`${icon} text-white`} />
    </div>
  );
});

CustomTokenIcon.displayName = 'CustomTokenIcon';

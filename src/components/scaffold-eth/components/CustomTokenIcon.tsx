import { Coins } from 'lucide-react';
import { memo } from 'react';
import { TokenSizeVariant, getTokenSizeClasses } from '../utils/tokenSizeUtils';

interface CustomTokenIconProps {
  size?: TokenSizeVariant;
}

/**
 * A generic token icon, for custom tokens and tokens without a logo.
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

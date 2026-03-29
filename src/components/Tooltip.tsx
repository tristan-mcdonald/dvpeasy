import { ReactNode, useState } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
}

export default function Tooltip ({ children, content }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
    className="relative flex"
    onMouseEnter={() => setIsVisible(true)}
    onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-interface-dark rounded bottom-full left-1/2 transform -translate-x-1/2 mb-1 whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t--interface-dark"></div>
        </div>
      )}
    </div>
  );
}

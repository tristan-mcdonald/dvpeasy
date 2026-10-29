import { RefObject, useEffect, useRef, useState } from 'react';

/**
 * Turns interaction on when the SVG is clicked, and off on a click outside the container or on
 * Escape, so that scrolling the page doesn't zoom the graph. The ref gives D3's handlers the
 * current value without redrawing.
 */
export function useClickToInteract (
  containerRef: RefObject<HTMLDivElement>,
  svgRef: RefObject<SVGSVGElement>,
) {
  const [isInteractionEnabled, setIsInteractionEnabled] = useState(false);
  const isInteractionEnabledRef = useRef(false);

  useEffect(() => {
    const containerElement = containerRef.current;
    const svgElement = svgRef.current;
    if (!containerElement || !svgElement) return;

    const setInteractionEnabled = (isEnabled: boolean) => {
      isInteractionEnabledRef.current = isEnabled;
      setIsInteractionEnabled(isEnabled);
    };

    const handleGraphClick = (event: MouseEvent) => {
      event.stopPropagation();
      if (!isInteractionEnabledRef.current) setInteractionEnabled(true);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (!containerElement.contains(event.target as Node)) setInteractionEnabled(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isInteractionEnabledRef.current) setInteractionEnabled(false);
    };

    svgElement.addEventListener('click', handleGraphClick);
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      svgElement.removeEventListener('click', handleGraphClick);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, svgRef]);

  return { isInteractionEnabled, isInteractionEnabledRef };
}

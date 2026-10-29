import { FlowForDisplay } from '../../types/settlement';
import { useClickToInteract } from './hooks/useClickToInteract';
import { useRef } from 'react';
import { useSettlementGraph } from './hooks/useSettlementGraph';

interface SettlementGraphProps {
  flows: FlowForDisplay[];
}

/**
 * The settlement's parties and flows as a graph, which can be zoomed, panned and dragged once
 * it's been clicked.
 */
export default function SettlementGraph ({ flows }: SettlementGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { isInteractionEnabled, isInteractionEnabledRef } = useClickToInteract(containerRef, svgRef);
  useSettlementGraph({ svgRef, flows, isInteractionEnabledRef });

  return (
    <div className="space-y-3">
      <h2>Settlement visualisation</h2>
      <div
        ref={containerRef}
        className={`block w-full shadow-standard rounded-lg bg-input-background border p-4 space-y-4 relative transition-all duration-200 ${
          isInteractionEnabled
            ? 'border-primary-subtle'
            : 'border-interface-border hover:border-primary-subtle'
        }`}>
        <svg
          className="w-full"
          ref={svgRef} />
        {!isInteractionEnabled && (
          <div className="absolute inset-0 !mt-0 rounded-lg flex items-center justify-center pointer-events-none">
            <div className="bg-card-background px-4 py-2 rounded-md shadow-standard border border-interface-border">
              <p className="text-sm font-medium">Click to interact with graph</p>
              <p className="text-xs text-text-label mt-1">Zoom, pan, and explore the settlement flows</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

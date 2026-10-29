import { FlowForDisplay } from '../../types/settlement';
import { utilityManager } from '../../lib/utils';

import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3';

export const labelFontFamily = 'Geist, system-ui, -apple-system, sans-serif';

const nodeHeight = 40;
const nodeMinimumWidth = 80;
const nodeTextPadding = 20;

/**
 * A party in the graph, positioned by the force simulation.
 */
export interface GraphNode extends SimulationNodeDatum {
  address: string;
  label: string;
  width: number;
  height: number;
  gradientId: string;
  x: number;
  y: number;
}

/**
 * A flow from one party to another. Flows in the same direction between the same two parties are
 * parallel, and curve apart by their index among them.
 */
export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: GraphNode;
  target: GraphNode;
  label: string;
  parallelIndex: number;
  parallelCount: number;
}

/**
 * The settlement's parties, in the order they first appear in the flows, and a link for each flow.
 */
export function buildGraph (flows: FlowForDisplay[]): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodesByAddress = new Map<string, GraphNode>();
  const nodeFor = (address: string) => {
    const existingNode = nodesByAddress.get(address);
    if (existingNode) return existingNode;

    const label = utilityManager.shortenAddress(address);
    const node: GraphNode = {
      address,
      label,
      width: Math.max(nodeMinimumWidth, measureTextWidth(label) + nodeTextPadding * 2),
      height: nodeHeight,
      gradientId: `nodeGradient-${nodesByAddress.size}`,
      x: 0,
      y: 0,
    };
    nodesByAddress.set(address, node);
    return node;
  };

  const links = flows.map(flow => ({
    source: nodeFor(flow.from),
    target: nodeFor(flow.to),
    label: flow.amount,
  }));

  return {
    nodes: [...nodesByAddress.values()],
    links: links.map(link => {
      const parallelLinks = links.filter(otherLink =>
        otherLink.source === link.source && otherLink.target === link.target,
      );
      return {
        ...link,
        parallelIndex: parallelLinks.indexOf(link),
        parallelCount: parallelLinks.length,
      };
    }),
  };
}

/**
 * The width of a label in pixels, so that each node fits its address.
 */
function measureTextWidth (text: string, fontSize = 12) {
  const context = document.createElement('canvas').getContext('2d')!;
  context.font = `${fontSize}px ${labelFontFamily}`;
  return context.measureText(text).width;
}

import './SettlementGraph.css';
import { cssCustomProperty, graphColors, nodeColors } from '../config/theme';
import { drag } from 'd3-drag';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
import { select, Selection } from 'd3-selection';
import { utilityManager } from '../lib/utils';
import { useEffect, useRef, useState } from 'react';
import { zoom, zoomIdentity } from 'd3-zoom';

import type { D3DragEvent, SimulationLinkDatum, SimulationNodeDatum, D3ZoomEvent, ZoomBehavior } from 'd3';

interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

interface D3SimulationNode extends SimulationNodeDatum {
  id: string;
  radius: number;
  width: number;
  height: number;
  gradientId: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface D3SimulationLink extends SimulationLinkDatum<D3SimulationNode> {
  source: string | D3SimulationNode;
  target: string | D3SimulationNode;
  label: string;
}

interface GradientStop {
  offset: string;
  color: string;
}

type D3DragEventLocal = D3DragEvent<SVGGElement, D3SimulationNode, D3SimulationNode>;

interface SettlementGraphProps {
  flows: {
    token: string;
    isNFT: boolean;
    from: string;
    to: string;
    amountOrId: bigint;
    formattedAmount: string;
  }[];
  tokenMetadata: Record<string, { symbol: string; isNFT: boolean; isLoading: boolean }>;
}

export default function SettlementGraph ({ flows, tokenMetadata }: SettlementGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setCopiedAddress] = useState<string | null>(null);
  const [isInteractionEnabled, setIsInteractionEnabled] = useState<boolean>(false);
  // Use a ref to store the current copied address for D3.js to access.
  const copiedAddressRef = useRef<string | null>(null);
  /**
   * Use a ref to store the mapping of shortened addresses to original addresses. This ensures the
   * mapping persists between renders and is accessible in event handlers.
   */
  const addressMappingRef = useRef<Record<string, string>>({});
  // Store zoom behavior reference for conditional enabling/disabling.
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  // Use ref for interaction state to avoid re-renders.
  const isInteractionEnabledRef = useRef<boolean>(false);

  useEffect(() => {
    if (!svgRef.current || flows.length === 0) return;

    // Clear any existing graph.
    select(svgRef.current).selectAll('*').remove();

    // Clear the address mapping.
    addressMappingRef.current = {};

    // Transform flows into graph data format.
    const data: GraphEdge[] = flows.map(flow => {
      // Add to address mapping
      const shortenedFrom = utilityManager.shortenAddress(flow.from);
      const shortenedTo = utilityManager.shortenAddress(flow.to);
      addressMappingRef.current[shortenedFrom] = flow.from;
      addressMappingRef.current[shortenedTo] = flow.to;

      return {
        source: shortenedFrom,
        target: shortenedTo,
        label: flow.formattedAmount,
      };
    });

    // Extract unique nodes from the data.
    const nodeIds = [...new Set(data.flatMap(d => [d.source, d.target]))];
    const nodes: Partial<D3SimulationNode>[] = nodeIds.map(id => ({ id }));

    // Set up links with proper references.
    const links: D3SimulationLink[] = data.map(d => ({
      source: d.source,
      target: d.target,
      label: d.label,
    }));

    // Get SVG dimensions and calculate optimal height.
    const svg = select(svgRef.current);
    const width = svgRef.current.getBoundingClientRect().width;

    // Define layout constants.
    const horizontalSpacing = 300;
    const verticalSpacing = 200;
    const nodeHeight = 40;
    const padding = 50; // Top and bottom padding.

    const maxNodesPerRow = Math.floor(width / horizontalSpacing);
    const totalRows = Math.ceil(nodes.length / maxNodesPerRow);
    const calculatedHeight = Math.max(300, (totalRows * verticalSpacing) + (padding * 2));

    // Set the SVG height dynamically.
    svgRef.current.setAttribute('height', calculatedHeight.toString());
    const height = calculatedHeight;

    // Create a container group for zoom/pan transformations.
    const container = svg.append('g').attr('class', 'zoom-container');

    // Set up zoom behavior.
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4]) // Allow zoom from 10% to 400%.
      .extent([[0, 0], [width, height]])
      .filter(() => {
        // Only allow zoom/pan when interactions are enabled.
        return isInteractionEnabledRef.current;
      })
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        container.attr('transform', event.transform.toString());
      });

    // Store zoom behavior reference for later use.
    zoomBehaviorRef.current = zoomBehavior;

    // Apply zoom behavior to SVG and set initial zoom to fit content.
    svg.call(zoomBehavior);

    // Define node dimensions.
    const nodeRadius = 25;
    const cornerRadius = 8;
    const minNodeWidth = 80;
    const textPadding = 20;

    // Function to calculate text width.
    function getTextWidth (text: string, fontSize = 12, fontFamily = 'Geist, system-ui, -apple-system, sans-serif') {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      context.font = `${fontSize}px ${fontFamily}`;
      return context.measureText(text).width;
    }

    // Calculate node width and set initial positions. Grid layout calculations use these constants.
    nodes.forEach((node: Partial<D3SimulationNode>, i) => {
      node.radius = nodeRadius;
      const textWidth = getTextWidth(node.id!);
      node.width = Math.max(minNodeWidth, textWidth + textPadding * 2);
      node.height = nodeHeight;

      // Set initial positions to prevent top-right clustering.
      const row = Math.floor(i / maxNodesPerRow);
      const col = i % maxNodesPerRow;
      const totalRows = Math.ceil(nodes.length / maxNodesPerRow);
      const totalGridHeight = totalRows * verticalSpacing;
      const verticalOffset = Math.max(0, (height - totalGridHeight) / 2);

      node.x = (col * horizontalSpacing) + (horizontalSpacing / 2) +
               ((width - (Math.min(nodes.length, maxNodesPerRow) * horizontalSpacing)) / 2);
      node.y = (row * verticalSpacing) + (verticalSpacing / 2) + verticalOffset;
    });

    // Custom force to arrange nodes in a grid.
    function gridForce (alpha: number) {
      // Calculate total rows needed
      const totalRows = Math.ceil(nodes.length / maxNodesPerRow);
      // Calculate total height needed for the grid.
      const totalGridHeight = totalRows * verticalSpacing;
      // Calculate vertical offset to center the grid.
      const verticalOffset = Math.max(0, (height - totalGridHeight) / 2);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as D3SimulationNode;

        // Calculate row and column for this node.
        const row = Math.floor(i / maxNodesPerRow);
        const col = i % maxNodesPerRow;

        // Calculate target position (centered grid both horizontally and vertically).
        const targetX = (col * horizontalSpacing) + (horizontalSpacing / 2) +
                        ((width - (Math.min(nodes.length, maxNodesPerRow) * horizontalSpacing)) / 2);
        const targetY = (row * verticalSpacing) + (verticalSpacing / 2) + verticalOffset;

        // Apply force toward target position.
        node.vx = (node.vx || 0) + (targetX - node.x) * alpha * 0.5;
        node.vy = (node.vy || 0) + (targetY - node.y) * alpha * 0.3;
      }
    }

    // Initialize force simulation.
    const simulation = forceSimulation(nodes as D3SimulationNode[])
      .force('link', forceLink(links).id((d: D3SimulationNode) => d.id).distance(400))
      .force('charge', forceManyBody().strength(-200))
      .force('collision', forceCollide().radius((d: D3SimulationNode) => Math.sqrt((d.width/2)**2 + (d.height/2)**2) + 40))
      .force('grid', gridForce as (alpha: number) => void)
      .force('x', forceX(width / 2).strength(0.05))
      .force('y', forceY(height / 2).strength(0.03));

    // Add SVG definitions.
    const defs = svg.append('defs');

    // Add drop shadow filter matching app's shadow style.
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    // First shadow layer: 0 4px 6px -1px hsla(34, 100%, 90%, 0.2).
    filter.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 4)
      .attr('stdDeviation', 3) // 6px blur with -1px spread approximation.
      .attr('flood-color', 'hsla(34, 100%, 90%, 0.2)');

    // Second shadow layer: 0 2px 4px -2px hsla(34, 100%, 50%, 0.1).
    filter.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('stdDeviation', 2) // 4px blur with -2px spread approximation.
      .attr('flood-color', 'hsla(34, 100%, 50%, 0.1)');

    // Add glow filter for hover effects.
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', 3)
      .attr('result', 'coloredBlur');

    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create edge gradient.
    const edgeGradient = defs.append('linearGradient')
      .attr('id', 'edge-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    edgeGradient.selectAll('stop')
      .data([
        {offset: '0%', color: 'rgba(107, 114, 128, 0.6)'},
        {offset: '50%', color: 'rgba(107, 114, 128, 0.8)'},
        {offset: '100%', color: 'rgba(107, 114, 128, 0.6)'},
      ])
      .enter().append('stop')
      .attr('offset', (d: GradientStop) => d.offset)
      .attr('stop-color', (d: GradientStop) => d.color);

    // Add arrowhead marker for directed edges.
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'hsla(34.1, 100%, 62.7%, 0.5)');


    // Create gradients for each node.
    nodes.forEach((node: Partial<D3SimulationNode>, i) => {
      const colors = nodeColors(i);

      // Create sophisticated multi-stop gradient.
      defs.append('linearGradient')
        .attr('id', `nodeGradient-${i}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%') // Diagonal gradient for more depth.
        .selectAll('stop')
        .data([
          {offset: '0%', color: colors.primary},
          {offset: '50%', color: colors.secondary},
          {offset: '100%', color: colors.accent || colors.secondary},
        ])
        .enter().append('stop')
        .attr('offset', (d: GradientStop) => d.offset)
        .attr('stop-color', (d: GradientStop) => d.color);

      node.gradientId = `nodeGradient-${i}`;
    });

    // Function to create curved paths for edges.
    function getEdgePath (d: D3SimulationLink) {
      const sourceNode = nodes.find((n: Partial<D3SimulationNode>) => n.id === (typeof d.source === 'string' ? d.source : (d.source as D3SimulationNode).id)) as D3SimulationNode;
      const targetNode = nodes.find((n: Partial<D3SimulationNode>) => n.id === (typeof d.target === 'string' ? d.target : (d.target as D3SimulationNode).id)) as D3SimulationNode;

      if (!sourceNode || !targetNode) return '';

      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate intersection points with rectangles, for source node (outgoing edge).
      let sourceX, sourceY;
      const halfSourceWidth = sourceNode.width / 2;
      const halfSourceHeight = sourceNode.height / 2;

      // Determine which side of the rectangle the edge intersects.
      const angle = Math.atan2(dy, dx);
      if (Math.abs(Math.tan(angle)) < halfSourceHeight / halfSourceWidth) {
        // Intersects with right or left side.
        sourceX = sourceNode.x + (Math.cos(angle) > 0 ? halfSourceWidth : -halfSourceWidth);
        sourceY = sourceNode.y + Math.tan(angle) * (sourceX - sourceNode.x);
      } else {
        // Intersects with top or bottom side.
        sourceY = sourceNode.y + (Math.sin(angle) > 0 ? halfSourceHeight : -halfSourceHeight);
        sourceX = sourceNode.x + (sourceY - sourceNode.y) / Math.tan(angle);
      }

      // For target node (incoming edge).
      let targetX, targetY;
      const halfTargetWidth = targetNode.width / 2;
      const halfTargetHeight = targetNode.height / 2;

      // Determine which side of the rectangle the edge intersects.
      if (Math.abs(Math.tan(angle)) < halfTargetHeight / halfTargetWidth) {
        // Intersects with right or left side.
        targetX = targetNode.x + (Math.cos(angle) < 0 ? halfTargetWidth : -halfTargetWidth);
        targetY = targetNode.y + Math.tan(angle) * (targetX - targetNode.x);
      } else {
        // Intersects with top or bottom side.
        targetY = targetNode.y + (Math.sin(angle) < 0 ? halfTargetHeight : -halfTargetHeight);
        targetX = targetNode.x + (targetY - targetNode.y) / Math.tan(angle);
      }

      // Calculate index for multiple edges between same nodes.
      const sameEdges = links.filter(l => {
        const lSourceId = typeof l.source === 'string' ? l.source : (l.source as D3SimulationNode).id;
        const lTargetId = typeof l.target === 'string' ? l.target : (l.target as D3SimulationNode).id;
        return (lSourceId === sourceNode.id && lTargetId === targetNode.id);
      });
      const edgeIndex = sameEdges.indexOf(d);
      const totalEdges = sameEdges.length;

      // Calculate the normal vector (perpendicular to the line).
      const normalX = -dy / distance;
      const normalY = dx / distance;

      // For single edges, use a simple quadratic curve.
      if (totalEdges === 1) {
        // Calculate control point for a simple curve.
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        // Add a slight curve even for single edges.
        const normalOffset = Math.min(40, distance * 0.2); // Scale with distance but cap at 40px
        return `M${sourceX},${sourceY} Q${midX + normalX * normalOffset},${midY + normalY * normalOffset} ${targetX},${targetY}`;
      } else {
        /**
         * For parallel edges, use a more sophisticated approach. Calculate the offset based on the
         * edge index. Use a more moderate offset that scales with distance.
         */
        const baseOffset = distance * 0.15; // 15% of the distance between nodes.
        const maxOffset = Math.min(50, distance * 0.25); // Cap at 50px or 25% of distance.

        // Calculate progressive offset for each parallel edge.
        let offset;
        if (totalEdges === 2) {
          // For 2 edges, place them symmetrically on either side.
          offset = edgeIndex === 0 ? -baseOffset : baseOffset;
        } else {
          // For more edges, distribute them evenly.
          offset = ((edgeIndex / (totalEdges - 1)) * 2 - 1) * maxOffset;
        }

        // Create a more pronounced curve for parallel edges.
        const controlPointX = (sourceX + targetX) / 2 + normalX * offset * 1.5;
        const controlPointY = (sourceY + targetY) / 2 + normalY * offset * 1.5;
        return `M${sourceX},${sourceY} Q${controlPointX},${controlPointY} ${targetX},${targetY}`;
      }
    }

    // Add links.
    const link = container.append('g')
      .attr('class', 'edge')
      .selectAll('g')
      .data(links)
      .enter()
      .append('g');

    // Draw edges with styling and entrance animation.
    link.append('path')
      .attr('id', (d: D3SimulationLink, i: number) => `edge${i}`)
      .attr('d', getEdgePath)
      .attr('marker-end', 'url(#arrow)')
      .attr('stroke', 'hsla(34.1, 100%, 62.7%, 0)')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .transition()
      .duration(800)
      .delay((d: D3SimulationLink, i: number) => i * 100)
      .attr('stroke', 'hsla(34.1, 100%, 62.7%, 0.5)');

    // Add hover effects to edges.
    link
      .on('mouseenter', function () {
        select(this).select('path')
          .transition()
          .duration(200)
          .attr('stroke-width', 3)
          .attr('stroke', 'hsla(34.1, 100%, 62.7%, 0.7)');
      })
      .on('mouseleave', function () {
        select(this).select('path')
          .transition()
          .duration(200)
          .attr('stroke-width', 2)
          .attr('stroke', 'hsla(34.1, 100%, 62.7%, 0.5)');
      });

    // Create paths for text.
    svg.append('defs').selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('id', (d: D3SimulationLink, i: number) => `textPath${i}`);

    // Add edge labels.
    const edgeLabels = link.append('g')
      .attr('class', 'edge-label-container');


    // Add actual text with entrance animation.
    edgeLabels.append('text')
      .attr('class', 'edge-label')
      .attr('dy', -5)
      .attr('font-family', 'Geist, system-ui, -apple-system, sans-serif')
      .attr('opacity', 0)
      .append('textPath')
      .attr('xlink:href', (d: D3SimulationLink, i: number) => `#textPath${i}`)
      .attr('startOffset', '50%')
      .attr('text-anchor', 'middle')
      .text((d: D3SimulationLink) => d.label);

    // Animate in edge labels after edges.
    edgeLabels.select('text')
      .transition()
      .duration(600)
      .delay((d: D3SimulationLink, i: number) => 400 + (i * 100))
      .attr('opacity', 1);

    // Add nodes with entrance animation.
    const node = container.append('g')
      .attr('class', 'node')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('opacity', 0)
      .attr('transform', 'scale(0)')
      .call(drag<SVGGElement, D3SimulationNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Animate nodes in with scale and opacity.
    node.transition()
      .duration(600)
      .delay((d: D3SimulationNode, i: number) => i * 150)
      .attr('opacity', 1)
      .attr('transform', 'scale(1)');

    // Draw node rectangles.
    node.append('rect')
      .attr('width', (d: D3SimulationNode) => d.width)
      .attr('height', (d: D3SimulationNode) => d.height)
      .attr('x', (d: D3SimulationNode) => -d.width / 2)
      .attr('y', (d: D3SimulationNode) => -d.height / 2)
      .attr('rx', cornerRadius)
      .attr('ry', cornerRadius)
      .attr('fill', (d: D3SimulationNode) => `url(#${d.gradientId})`)
      .attr('stroke', graphColors.node.strokeColor)
      .attr('stroke-width', graphColors.node.strokeWidth)
      .attr('filter', 'url(#drop-shadow)');

    // Add hover effects to nodes.
    node
      .on('mouseenter', function () {
        select(this).select('rect')
          .transition()
          .duration(200)
          .attr('stroke-width', 3)
          .attr('filter', 'url(#glow)');
      })
      .on('mouseleave', function () {
        select(this).select('rect')
          .transition()
          .duration(200)
          .attr('stroke-width', graphColors.node.strokeWidth)
          .attr('filter', 'url(#drop-shadow)');
      });

    // Add node labels.
    node.append('text')
      .attr('dy', 5)
      .attr('text-anchor', 'middle')
      .text((d: D3SimulationNode) => d.id)
      .attr('font-size', '0.7rem')
      .attr('font-family', 'Geist, system-ui, -apple-system, sans-serif')
      .attr('fill', graphColors.node.textFill)
      .attr('pointer-events', 'none')
      .attr('font-weight', 'bold');

    // Get the primary color from CSS variables using theme utility.
    const primaryColor = cssCustomProperty('--color-primary');
    const circleBorderColor = cssCustomProperty('--color-primary-subtle');

    // Function to update the icon.
    const updateIcon = (button: Selection<SVGGElement, D3SimulationNode, SVGGElement, unknown>, originalAddress: string | null) => {
      button.selectAll('.icon').remove();

      // Use the ref instead of the captured state value.
      if (copiedAddressRef.current === originalAddress) {
        // Show check icon when copied - coordinates are carefully centered within the circle.
        button.append('path')
          .attr('class', 'icon')
          .attr('d', 'M-4,0 L-1,3 L4,-2') // Centered checkmark: starts left, goes up, ends right.
          .attr('stroke', graphColors.node.copyIconStroke)
          .attr('stroke-width', 2)
          .attr('fill', 'none');
      } else {
        // Show copy icon.
        button.append('rect')
          .attr('class', 'icon')
          .attr('x', -4)
          .attr('y', -4)
          .attr('width', 6)
          .attr('height', 6)
          .attr('fill', 'none')
          .attr('stroke', primaryColor)
          .attr('stroke-width', 1);

        button.append('rect')
          .attr('class', 'icon')
          .attr('x', -2)
          .attr('y', -2)
          .attr('width', 6)
          .attr('height', 6)
          .attr('fill', 'white')
          .attr('stroke', primaryColor)
          .attr('stroke-width', 1);
      }
    };

    // Add copy button to each node.
    const copyButton = node.append('g')
      .attr('class', 'copy-button')
      .attr('transform', (d: D3SimulationNode) => `translate(${d.width / 2 - 15}, ${-d.height / 2 + 5})`)
      .style('cursor', 'pointer')
      .on('click', async function (event: MouseEvent, d: D3SimulationNode) {
        event.stopPropagation(); // Prevent node drag when clicking the button.
        const button = select(this);
        const originalAddress = addressMappingRef.current[d.id];
        if (originalAddress) {
          // Add click animation.
          button.transition()
            .duration(150)
            .attr('transform', `translate(${d.width / 2 - 15}, ${-d.height / 2 + 5}) scale(1.2)`)
            .transition()
            .duration(150)
            .attr('transform', `translate(${d.width / 2 - 15}, ${-d.height / 2 + 5}) scale(1)`);

          await navigator.clipboard.writeText(originalAddress);
          // Update both state and ref.
          setCopiedAddress(originalAddress);
          copiedAddressRef.current = originalAddress;
          updateIcon(button, originalAddress);

          // Add success pulse animation.
          button.select('circle:last-child')
            .transition()
            .duration(300)
            .attr('r', 12)
            .transition()
            .duration(300)
            .attr('r', 10);

          await new Promise(resolve => setTimeout(resolve, 2000));
          setCopiedAddress(null);
          copiedAddressRef.current = null;
          updateIcon(button, originalAddress);
        }
      });

    // Add invisible larger hit area for better clickability.
    copyButton.append('circle')
      .attr('r', 15)
      .attr('fill', 'transparent')
      .attr('class', 'copy-button-hit-area');

    // Add copy button visible background.
    copyButton.append('circle')
      .attr('r', 10)
      .attr('fill', 'white')
      .attr('stroke', circleBorderColor)
      .attr('stroke-width', 1);

    // Add copy or check icon based on copied state.
    copyButton.each(function (d: D3SimulationNode) {
      const button = select(this);
      const originalAddress = addressMappingRef.current[d.id];

      // Initial icon.
      updateIcon(button, originalAddress);
    });

    // Function to create text paths that ensures readability.
    function getTextPath (d: D3SimulationLink) {
      const sourceNode = nodes.find((n: Partial<D3SimulationNode>) => n.id === (typeof d.source === 'string' ? d.source : (d.source as D3SimulationNode).id)) as D3SimulationNode;
      const targetNode = nodes.find((n: Partial<D3SimulationNode>) => n.id === (typeof d.target === 'string' ? d.target : (d.target as D3SimulationNode).id)) as D3SimulationNode;

      if (!sourceNode || !targetNode) return '';

      /**
       * Create a path similar to getEdgePath but always in the same direction. This ensures text is
       * always oriented in a normal reading direction.
       */
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Determine if the edge is going from right to left.
      const isRightToLeft = sourceNode.x > targetNode.x;

      // Calculate intersection points with rectangles (same as in getEdgePath).
      let sourceX, sourceY;
      const halfSourceWidth = sourceNode.width / 2;
      const halfSourceHeight = sourceNode.height / 2;

      const angle = Math.atan2(dy, dx);
      if (Math.abs(Math.tan(angle)) < halfSourceHeight / halfSourceWidth) {
        sourceX = sourceNode.x + (Math.cos(angle) > 0 ? halfSourceWidth : -halfSourceWidth);
        sourceY = sourceNode.y + Math.tan(angle) * (sourceX - sourceNode.x);
      } else {
        sourceY = sourceNode.y + (Math.sin(angle) > 0 ? halfSourceHeight : -halfSourceHeight);
        sourceX = sourceNode.x + (sourceY - sourceNode.y) / Math.tan(angle);
      }

      let targetX, targetY;
      const halfTargetWidth = targetNode.width / 2;
      const halfTargetHeight = targetNode.height / 2;

      if (Math.abs(Math.tan(angle)) < halfTargetHeight / halfTargetWidth) {
        targetX = targetNode.x + (Math.cos(angle) < 0 ? halfTargetWidth : -halfTargetWidth);
        targetY = targetNode.y + Math.tan(angle) * (targetX - targetNode.x);
      } else {
        targetY = targetNode.y + (Math.sin(angle) < 0 ? halfTargetHeight : -halfTargetHeight);
        targetX = targetNode.x + (targetY - targetNode.y) / Math.tan(angle);
      }

      // Calculate the normal vector (perpendicular to the line).
      const normalX = -dy / distance;
      const normalY = dx / distance;

      // Calculate index for multiple edges between the same nodes.
      const sameEdges = links.filter(l => {
        const lSourceId = typeof l.source === 'string' ? l.source : (l.source as D3SimulationNode).id;
        const lTargetId = typeof l.target === 'string' ? l.target : (l.target as D3SimulationNode).id;
        return (lSourceId === sourceNode.id && lTargetId === targetNode.id);
      });
      const edgeIndex = sameEdges.indexOf(d);
      const totalEdges = sameEdges.length;

      // Create the path based on the direction.
      if (totalEdges === 1) {
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        const normalOffset = Math.min(40, distance * 0.2);

        // For right-to-left edges, reverse the path direction to keep text readable.
        if (isRightToLeft) {
          return `M${targetX},${targetY} Q${midX + normalX * normalOffset},${midY + normalY * normalOffset} ${sourceX},${sourceY}`;
        } else {
          return `M${sourceX},${sourceY} Q${midX + normalX * normalOffset},${midY + normalY * normalOffset} ${targetX},${targetY}`;
        }
      } else {
        const baseOffset = distance * 0.15;
        const maxOffset = Math.min(50, distance * 0.25);

        let offset;
        if (totalEdges === 2) {
          offset = edgeIndex === 0 ? -baseOffset : baseOffset;
        } else {
          offset = ((edgeIndex / (totalEdges - 1)) * 2 - 1) * maxOffset;
        }

        const controlPointX = (sourceX + targetX) / 2 + normalX * offset * 1.5;
        const controlPointY = (sourceY + targetY) / 2 + normalY * offset * 1.5;

        // For right-to-left edges, reverse the path direction to keep text readable.
        if (isRightToLeft) {
          return `M${targetX},${targetY} Q${controlPointX},${controlPointY} ${sourceX},${sourceY}`;
        } else {
          return `M${sourceX},${sourceY} Q${controlPointX},${controlPointY} ${targetX},${targetY}`;
        }
      }
    }

    // Update positions on each tick.
    simulation.on('tick', () => {
      // Keep nodes within bounds.
      nodes.forEach((d: D3SimulationNode) => {
        const halfWidth = d.width / 2;
        const halfHeight = d.height / 2;
        d.x = Math.max(halfWidth, Math.min(width - halfWidth, d.x));
        d.y = Math.max(halfHeight, Math.min(height - halfHeight, d.y));
      });

      // Update edge paths.
      link.select('path')
        .attr('d', getEdgePath);

      // Update text paths.
      links.forEach((d: D3SimulationLink, i: number) => {
        select(`#textPath${i}`).attr('d', getTextPath(d));
      });

      // Update node positions.
      node.attr('transform', (d: D3SimulationNode) => `translate(${d.x},${d.y})`);
    });

    // Drag functions.
    function dragstarted (event: D3DragEventLocal, d: D3SimulationNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged (event: D3DragEventLocal, d: D3SimulationNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended (event: D3DragEventLocal) {
      if (!event.active) simulation.alphaTarget(0);
      /**
       * Keep the node pinned at its current position. d.fx and d.fy are already set to the current
       * position in dragstarted and updated in dragged.
       */
      simulation.alpha(0.3).restart();
    }

    // Function to calculate bounds and auto-fit the graph.
    function zoomToFit () {
      if (nodes.length === 0) return;

      // Calculate the bounding box of all nodes.
      const bounds = {
        minX: Math.min(...nodes.map((d: Partial<D3SimulationNode>) => (d.x || 0) - (d.width || 0) / 2)),
        maxX: Math.max(...nodes.map((d: Partial<D3SimulationNode>) => (d.x || 0) + (d.width || 0) / 2)),
        minY: Math.min(...nodes.map((d: Partial<D3SimulationNode>) => (d.y || 0) - (d.height || 0) / 2)),
        maxY: Math.max(...nodes.map((d: Partial<D3SimulationNode>) => (d.y || 0) + (d.height || 0) / 2)),
      };

      const boundsWidth = bounds.maxX - bounds.minX;
      const boundsHeight = bounds.maxY - bounds.minY;
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;

      // Calculate scale to fit with padding.
      const padding = 60;
      const scale = Math.min(
        (width - padding) / boundsWidth,
        (height - padding) / boundsHeight,
      );

      // Clamp scale to zoom limits.
      const clampedScale = Math.max(0.1, Math.min(2, scale));

      // Calculate translation to center the content.
      const translateX = width / 2 - centerX * clampedScale;
      const translateY = height / 2 - centerY * clampedScale;

      // Apply the zoom transform smoothly.
      svg.transition()
        .duration(750)
        .call(
          zoomBehavior.transform,
          zoomIdentity.translate(translateX, translateY).scale(clampedScale),
        );
    }

    // Auto-fit after the simulation has settled.
    setTimeout(() => {
      zoomToFit();
    }, 1000);

    // Cleanup function.
    return () => {
      // Stop the D3.js simulation.
      simulation.stop();
    };
  }, [flows, tokenMetadata]);

  // Handle click events to enable/disable interactions.
  useEffect(() => {
    const handleGraphClick = (event: MouseEvent) => {
      event.stopPropagation();
      if (!isInteractionEnabledRef.current) {
        isInteractionEnabledRef.current = true;
        setIsInteractionEnabled(true);
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        isInteractionEnabledRef.current = false;
        setIsInteractionEnabled(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isInteractionEnabledRef.current) {
        isInteractionEnabledRef.current = false;
        setIsInteractionEnabled(false);
      }
    };

    const svgElement = svgRef.current;
    const containerElement = containerRef.current;

    if (svgElement && containerElement) {
      svgElement.addEventListener('click', handleGraphClick);
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        svgElement.removeEventListener('click', handleGraphClick);
        document.removeEventListener('click', handleDocumentClick);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isInteractionEnabled]);

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

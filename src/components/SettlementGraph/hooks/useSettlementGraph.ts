import { appendDefs } from '../defs';
import { buildGraph, GraphLink, GraphNode } from '../graph';
import { drag } from 'd3-drag';
import { drawEdges, drawNodes } from '../draw';
import { edgePath, labelPath } from '../geometry';
import { fitTransform, gridForce, gridLayout, gridPosition, keepInside, zoomScaleExtent } from '../layout';
import { FlowForDisplay } from '../../../types/settlement';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, Simulation } from 'd3-force';
import { MutableRefObject, RefObject, useEffect } from 'react';
import { select } from 'd3-selection';
import { zoom } from 'd3-zoom';

import type { D3DragEvent, D3ZoomEvent } from 'd3';

type NodeDragEvent = D3DragEvent<SVGGElement, GraphNode, GraphNode>;

// The simulation has mostly settled by then.
const fitDelay = 1000;

interface UseSettlementGraphOptions {
  svgRef: RefObject<SVGSVGElement>;
  flows: FlowForDisplay[];
  isInteractionEnabledRef: MutableRefObject<boolean>;
}

/**
 * Draws the flows into the SVG as a force-directed graph of the parties, laid out on a grid, and
 * zooms to fit it once it has settled. Zooming and panning work only while interaction is enabled.
 */
export function useSettlementGraph ({ svgRef, flows, isInteractionEnabledRef }: UseSettlementGraphOptions) {
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement || flows.length === 0) return;

    const svg = select(svgElement);
    svg.selectAll('*').remove();

    const { nodes, links } = buildGraph(flows);
    const layout = gridLayout(svgElement.getBoundingClientRect().width, nodes.length);
    svgElement.setAttribute('height', layout.height.toString());
    nodes.forEach((node, index) => Object.assign(node, gridPosition(layout, index)));

    const container = svg.append('g').attr('class', 'zoom-container');
    const zoomBehaviour = zoom<SVGSVGElement, unknown>()
      .scaleExtent(zoomScaleExtent)
      .extent([[0, 0], [layout.width, layout.height]])
      .filter(() => isInteractionEnabledRef.current)
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        container.attr('transform', event.transform.toString());
      });
    svg.call(zoomBehaviour);

    const simulation = forceSimulation(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links).id(node => node.address).distance(400))
      .force('charge', forceManyBody().strength(-200))
      .force('collision', forceCollide<GraphNode>().radius(collisionRadius))
      .force('grid', gridForce(nodes, layout))
      .force('x', forceX(layout.width / 2).strength(0.05))
      .force('y', forceY(layout.height / 2).strength(0.03));

    appendDefs(svg, nodes);
    const { edges, labelPaths } = drawEdges(svg, container, links);
    const nodeGroups = drawNodes(container, nodes, dragNodes(simulation));

    simulation.on('tick', () => {
      nodes.forEach(node => keepInside(node, layout));
      edges.select('path').attr('d', edgePath);
      labelPaths.attr('d', labelPath);
      nodeGroups.attr('transform', node => `translate(${node.x},${node.y})`);
    });

    const fitTimeout = setTimeout(() => {
      svg.transition()
        .duration(750)
        .call(zoomBehaviour.transform, fitTransform(nodes, layout));
    }, fitDelay);

    return () => {
      simulation.stop();
      clearTimeout(fitTimeout);
    };
  }, [svgRef, flows, isInteractionEnabledRef]);
}

/**
 * The radius of the circle around a node's rectangle, with room to spare between nodes.
 */
function collisionRadius (node: GraphNode) {
  return Math.sqrt((node.width / 2) ** 2 + (node.height / 2) ** 2) + 40;
}

/**
 * Lets the user drag a node, which stays where it's dropped.
 */
function dragNodes (simulation: Simulation<GraphNode, undefined>) {
  return drag<SVGGElement, GraphNode>()
    .on('start', (event: NodeDragEvent, node) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      node.fx = node.x;
      node.fy = node.y;
    })
    .on('drag', (event: NodeDragEvent, node) => {
      node.fx = event.x;
      node.fy = event.y;
    })
    .on('end', (event: NodeDragEvent) => {
      if (!event.active) simulation.alphaTarget(0);
      simulation.alpha(0.3).restart();
    });
}

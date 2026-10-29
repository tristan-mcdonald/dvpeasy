import { GraphNode } from './graph';
import { graphColors, nodeColors } from '../../config/theme';
import { Selection } from 'd3-selection';

/**
 * Adds the filters, arrowhead and node gradients which the edges and nodes refer to by ID.
 */
export function appendDefs (svg: Selection<SVGSVGElement, unknown, null, undefined>, nodes: GraphNode[]) {
  const defs = svg.append('defs');

  // Approximates `.shadow-standard` in `styles/index.css`. SVG shadows have no spread, so the
  // blur stands in for it.
  const dropShadow = appendFilter(defs, 'drop-shadow');
  dropShadow.append('feDropShadow')
    .attr('dx', 0)
    .attr('dy', 4)
    .attr('stdDeviation', 3)
    .attr('flood-color', 'hsla(34, 100%, 90%, 0.2)');
  dropShadow.append('feDropShadow')
    .attr('dx', 0)
    .attr('dy', 2)
    .attr('stdDeviation', 2)
    .attr('flood-color', 'hsla(34, 100%, 50%, 0.1)');

  const glow = appendFilter(defs, 'glow');
  glow.append('feGaussianBlur')
    .attr('stdDeviation', 3)
    .attr('result', 'coloredBlur');
  const glowMerge = glow.append('feMerge');
  glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
  glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

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
    .attr('fill', graphColors.edge.stroke);

  nodes.forEach((node, index) => {
    const colors = nodeColors(index);
    defs.append('linearGradient')
      .attr('id', node.gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: colors.primary },
        { offset: '50%', color: colors.secondary },
        { offset: '100%', color: colors.accent },
      ])
      .enter()
      .append('stop')
      .attr('offset', stop => stop.offset)
      .attr('stop-color', stop => stop.color);
  });
}

function appendFilter (defs: Selection<SVGDefsElement, unknown, null, undefined>, id: string) {
  return defs.append('filter')
    .attr('id', id)
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%');
}

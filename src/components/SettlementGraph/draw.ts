import { COPIED_DURATION } from '../../hooks/useCopyToClipboard';
import { copyToClipboard } from '../../lib/clipboard';
import { cssCustomProperty, graphColors } from '../../config/theme';
import { DragBehavior, SubjectPosition } from 'd3-drag';
import { GraphLink, GraphNode, labelFontFamily } from './graph';
import { select, Selection } from 'd3-selection';

type GraphSelection = Selection<SVGGElement, unknown, null, undefined>;

const nodeCornerRadius = 8;

/**
 * Draws an edge for each link, with its label on a path of its own, and fades them in one by one.
 * Returns the edges and the label paths, which the simulation moves on each tick.
 */
export function drawEdges (
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  container: GraphSelection,
  links: GraphLink[],
) {
  const edges = container.append('g')
    .attr('class', 'edge')
    .selectAll<SVGGElement, GraphLink>('g')
    .data(links)
    .enter()
    .append('g');

  edges.append('path')
    .attr('marker-end', 'url(#arrow)')
    .attr('stroke', graphColors.edge.strokeHidden)
    .attr('stroke-width', 2)
    .attr('fill', 'none')
    .transition()
    .duration(800)
    .delay((_link, index) => index * 100)
    .attr('stroke', graphColors.edge.stroke);

  edges
    .on('mouseenter', function () {
      select(this).select('path')
        .transition()
        .duration(200)
        .attr('stroke-width', 3)
        .attr('stroke', graphColors.edge.strokeHover);
    })
    .on('mouseleave', function () {
      select(this).select('path')
        .transition()
        .duration(200)
        .attr('stroke-width', 2)
        .attr('stroke', graphColors.edge.stroke);
    });

  const labelPaths = svg.append('defs')
    .selectAll<SVGPathElement, GraphLink>('path')
    .data(links)
    .enter()
    .append('path')
    .attr('id', (_link, index) => `textPath${index}`);

  edges.append('text')
    .attr('dy', -5)
    .attr('font-family', labelFontFamily)
    .attr('opacity', 0)
    .call(text => text.append('textPath')
      .attr('xlink:href', (_link, index) => `#textPath${index}`)
      .attr('startOffset', '50%')
      .attr('text-anchor', 'middle')
      .text(link => link.label))
    .transition()
    .duration(600)
    .delay((_link, index) => 400 + (index * 100))
    .attr('opacity', 1);

  return { edges, labelPaths };
}

/**
 * Draws each party as a rounded rectangle with its short address and a button which copies its
 * full address, and scales them in one by one.
 */
export function drawNodes (
  container: GraphSelection,
  nodes: GraphNode[],
  dragBehaviour: DragBehavior<SVGGElement, GraphNode, GraphNode | SubjectPosition>,
) {
  const nodeGroups = container.append('g')
    .attr('class', 'node')
    .selectAll<SVGGElement, GraphNode>('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('opacity', 0)
    .attr('transform', 'scale(0)')
    .call(dragBehaviour);

  nodeGroups.transition()
    .duration(600)
    .delay((_node, index) => index * 150)
    .attr('opacity', 1)
    .attr('transform', 'scale(1)');

  nodeGroups.append('rect')
    .attr('width', node => node.width)
    .attr('height', node => node.height)
    .attr('x', node => -node.width / 2)
    .attr('y', node => -node.height / 2)
    .attr('rx', nodeCornerRadius)
    .attr('ry', nodeCornerRadius)
    .attr('fill', node => `url(#${node.gradientId})`)
    .attr('stroke', graphColors.node.strokeColor)
    .attr('stroke-width', graphColors.node.strokeWidth)
    .attr('filter', 'url(#drop-shadow)');

  nodeGroups
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

  nodeGroups.append('text')
    .attr('dy', 5)
    .attr('text-anchor', 'middle')
    .text(node => node.label)
    .attr('font-size', '0.7rem')
    .attr('font-family', labelFontFamily)
    .attr('fill', graphColors.node.textFill)
    .attr('pointer-events', 'none')
    .attr('font-weight', 'bold');

  appendCopyButtons(nodeGroups);

  return nodeGroups;
}

/**
 * A button in each node's top right corner which copies the party's address, and shows a tick
 * for two seconds once it has.
 */
function appendCopyButtons (nodeGroups: Selection<SVGGElement, GraphNode, SVGGElement, unknown>) {
  const position = (node: GraphNode) => `translate(${node.width / 2 - 15}, ${-node.height / 2 + 5})`;

  const copyButtons = nodeGroups.append('g')
    .attr('class', 'copy-button')
    .attr('transform', position)
    .style('cursor', 'pointer')
    .on('click', async function (event: MouseEvent, node: GraphNode) {
      // Keeps the click from reaching the graph, which would turn on zooming and panning.
      event.stopPropagation();
      const copyButton = select(this);
      copyButton.transition()
        .duration(150)
        .attr('transform', `${position(node)} scale(1.2)`)
        .transition()
        .duration(150)
        .attr('transform', `${position(node)} scale(1)`);

      if (!await copyToClipboard(node.address)) return;
      showCopyIcon(copyButton, true);
      await new Promise(resolve => setTimeout(resolve, COPIED_DURATION));
      showCopyIcon(copyButton, false);
    });

  // A larger, invisible circle to make the button easier to hit.
  copyButtons.append('circle')
    .attr('r', 15)
    .attr('fill', 'transparent');

  copyButtons.append('circle')
    .attr('r', 10)
    .attr('fill', 'white')
    .attr('stroke', cssCustomProperty('--color-primary-subtle'))
    .attr('stroke-width', 1);

  copyButtons.each(function () {
    showCopyIcon(select(this), false);
  });
}

function showCopyIcon (copyButton: GraphSelection, isCopied: boolean) {
  copyButton.selectAll('.icon').remove();

  if (isCopied) {
    copyButton.append('path')
      .attr('class', 'icon')
      .attr('d', 'M-4,0 L-1,3 L4,-2')
      .attr('stroke', graphColors.node.copyIconStroke)
      .attr('stroke-width', 2)
      .attr('fill', 'none');
    return;
  }

  // Two overlapping squares, the usual copy icon.
  const primaryColor = cssCustomProperty('--color-primary');
  const squares = [{ corner: -4, fill: 'none' }, { corner: -2, fill: 'white' }];
  squares.forEach(({ corner, fill }) => {
    copyButton.append('rect')
      .attr('class', 'icon')
      .attr('x', corner)
      .attr('y', corner)
      .attr('width', 6)
      .attr('height', 6)
      .attr('fill', fill)
      .attr('stroke', primaryColor)
      .attr('stroke-width', 1);
  });
}

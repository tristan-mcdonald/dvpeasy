import { GraphNode } from './graph';
import { zoomIdentity, ZoomTransform } from 'd3-zoom';

const columnSpacing = 300;
const rowSpacing = 200;
const minimumHeight = 300;
const verticalPadding = 50;
const fitPadding = 60;

export const zoomScaleExtent: [number, number] = [0.1, 4];

/**
 * The grid the nodes are arranged in, for an SVG of the given width.
 */
export interface GridLayout {
  width: number;
  height: number;
  columnCount: number;
  rowCount: number;
  nodeCount: number;
}

export function gridLayout (width: number, nodeCount: number): GridLayout {
  // An SVG narrower than one column still has one, or no node would have a cell.
  const columnCount = Math.max(1, Math.floor(width / columnSpacing));
  const rowCount = Math.ceil(nodeCount / columnCount);
  const height = Math.max(minimumHeight, (rowCount * rowSpacing) + (verticalPadding * 2));
  return { width, height, columnCount, rowCount, nodeCount };
}

/**
 * The centre of a node's cell in the grid, with the grid centred in the SVG.
 */
export function gridPosition (layout: GridLayout, index: number) {
  const row = Math.floor(index / layout.columnCount);
  const column = index % layout.columnCount;
  const verticalOffset = Math.max(0, (layout.height - layout.rowCount * rowSpacing) / 2);

  return {
    x: (column * columnSpacing) + (columnSpacing / 2) +
      ((layout.width - (Math.min(layout.nodeCount, layout.columnCount) * columnSpacing)) / 2),
    y: (row * rowSpacing) + (rowSpacing / 2) + verticalOffset,
  };
}

/**
 * A force which pulls each node towards its cell in the grid, more strongly across than down.
 */
export function gridForce (nodes: GraphNode[], layout: GridLayout) {
  const targets = nodes.map((_node, index) => gridPosition(layout, index));
  return (alpha: number) => {
    nodes.forEach((node, index) => {
      const target = targets[index];
      node.vx = (node.vx || 0) + (target.x - node.x) * alpha * 0.5;
      node.vy = (node.vy || 0) + (target.y - node.y) * alpha * 0.3;
    });
  };
}

/**
 * Keeps a node's rectangle inside the SVG.
 */
export function keepInside (node: GraphNode, layout: GridLayout) {
  const halfWidth = node.width / 2;
  const halfHeight = node.height / 2;
  node.x = Math.max(halfWidth, Math.min(layout.width - halfWidth, node.x));
  node.y = Math.max(halfHeight, Math.min(layout.height - halfHeight, node.y));
}

/**
 * The zoom which fits every node in the SVG, centred, at no more than twice the size.
 */
export function fitTransform (nodes: GraphNode[], layout: GridLayout): ZoomTransform {
  const minimumX = Math.min(...nodes.map(node => node.x - node.width / 2));
  const maximumX = Math.max(...nodes.map(node => node.x + node.width / 2));
  const minimumY = Math.min(...nodes.map(node => node.y - node.height / 2));
  const maximumY = Math.max(...nodes.map(node => node.y + node.height / 2));

  const scale = Math.min(
    (layout.width - fitPadding) / (maximumX - minimumX),
    (layout.height - fitPadding) / (maximumY - minimumY),
  );
  const clampedScale = Math.max(zoomScaleExtent[0], Math.min(2, scale));

  return zoomIdentity
    .translate(
      layout.width / 2 - ((minimumX + maximumX) / 2) * clampedScale,
      layout.height / 2 - ((minimumY + maximumY) / 2) * clampedScale,
    )
    .scale(clampedScale);
}

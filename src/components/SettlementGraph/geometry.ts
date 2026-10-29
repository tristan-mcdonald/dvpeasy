import { GraphLink, GraphNode } from './graph';

interface Point {
  x: number;
  y: number;
}

interface Curve {
  start: Point;
  control: Point;
  end: Point;
}

/**
 * The path of a link's edge, from the edge of one node's rectangle to the other's.
 */
export function edgePath (link: GraphLink): string {
  const { start, control, end } = edgeCurve(link);
  return quadraticPath(start, control, end);
}

/**
 * The path for a link's label: its edge, reversed when it runs right to left, so that the label
 * is never upside down.
 */
export function labelPath (link: GraphLink): string {
  const { start, control, end } = edgeCurve(link);
  const isRightToLeft = link.source.x > link.target.x;
  return isRightToLeft ? quadraticPath(end, control, start) : quadraticPath(start, control, end);
}

function quadraticPath (start: Point, control: Point, end: Point) {
  return `M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`;
}

function edgeCurve (link: GraphLink): Curve {
  const { source, target } = link;
  const deltaX = target.x - source.x;
  const deltaY = target.y - source.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX);

  const start = rectangleBoundaryPoint(source, angle, false);
  const end = rectangleBoundaryPoint(target, angle, true);

  // The control point sits off the midpoint, along the normal to the line between the nodes.
  const normalX = -deltaY / distance;
  const normalY = deltaX / distance;
  const offset = curveOffset(link, distance);

  return {
    start,
    control: {
      x: (start.x + end.x) / 2 + normalX * offset,
      y: (start.y + end.y) / 2 + normalY * offset,
    },
    end,
  };
}

/**
 * Where a line at `angle` through the node's centre crosses its rectangle: on the side it leaves
 * by, or, for the node it arrives at, the side it enters by.
 */
function rectangleBoundaryPoint (node: GraphNode, angle: number, isArriving: boolean): Point {
  const direction = isArriving ? -1 : 1;
  const halfWidth = node.width / 2;
  const halfHeight = node.height / 2;

  if (Math.abs(Math.tan(angle)) < halfHeight / halfWidth) {
    const x = node.x + (direction * Math.cos(angle) > 0 ? halfWidth : -halfWidth);
    return { x, y: node.y + Math.tan(angle) * (x - node.x) };
  }

  const y = node.y + (direction * Math.sin(angle) > 0 ? halfHeight : -halfHeight);
  return { x: node.x + (y - node.y) / Math.tan(angle), y };
}

/**
 * How far the curve bends from a straight line. A lone edge bends slightly; parallel edges bend
 * further, spread evenly on either side.
 */
function curveOffset ({ parallelIndex, parallelCount }: GraphLink, distance: number) {
  if (parallelCount === 1) return Math.min(40, distance * 0.2);

  const spread = parallelCount === 2
    ? (parallelIndex === 0 ? -distance * 0.15 : distance * 0.15)
    : ((parallelIndex / (parallelCount - 1)) * 2 - 1) * Math.min(50, distance * 0.25);
  return spread * 1.5;
}

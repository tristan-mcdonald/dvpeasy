/**
 * Colours which can't come from the stylesheet: the toasts', which react-hot-toast takes as values,
 * and the settlement graph's, which D3 sets as attributes.
 */

export const toastColors = {
  background: 'hsla(220, 45.8%, 11.6%, 1)',
  border: 'hsla(225, 48.8%, 16.1%, 1)',
  text: 'white',

  success: {
    primary: 'hsla(160.1, 84.1%, 39.4%, 1)',
    secondary: 'hsla(218.5, 33.9%, 77.5%, 1)',
    border: '1px solid hsla(160.1, 84.1%, 39.4%, 1)',
  },

  error: {
    primary: 'hsla(0, 93.2%, 65.5%, 1)',
    secondary: 'hsla(218.5, 33.9%, 77.5%, 1)',
    border: '1px solid hsla(0, 93.2%, 65.5%, 1)',
  },
} as const;

export const graphColors = {
  nodeGradients: [
    {primary: 'rgb(186, 230, 253)', secondary: 'rgb(147, 197, 253)', accent: 'rgb(59, 130, 246)' },
    {primary: 'rgb(254, 215, 170)', secondary: 'rgb(251, 191, 36)', accent: 'rgb(245, 158, 11)' },
    {primary: 'rgb(187, 247, 208)', secondary: 'rgb(134, 239, 172)', accent: 'rgb(34, 197, 94)' },
    {primary: 'rgb(254, 240, 138)', secondary: 'rgb(250, 204, 21)', accent: 'rgb(234, 179, 8)' },
    {primary: 'rgb(221, 214, 254)', secondary: 'rgb(196, 181, 253)', accent: 'rgb(147, 51, 234)' },
    {primary: 'rgb(165, 243, 252)', secondary: 'rgb(103, 232, 249)', accent: 'rgb(6, 182, 212)' },
    {primary: 'rgb(252, 231, 243)', secondary: 'rgb(249, 168, 212)', accent: 'rgb(236, 72, 153)' },
    {primary: 'rgb(199, 210, 254)', secondary: 'rgb(165, 180, 252)', accent: 'rgb(99, 102, 241)' },
    {primary: 'rgb(253, 230, 138)', secondary: 'rgb(252, 211, 77)', accent: 'rgb(251, 191, 36)' },
    {primary: 'rgb(153, 246, 228)', secondary: 'rgb(94, 234, 212)', accent: 'rgb(20, 184, 166)' },
    { primary: 'rgb(217, 249, 157)', secondary: 'rgb(190, 242, 100)', accent: 'rgb(132, 204, 22)' },
    { primary: 'rgb(244, 114, 182)', secondary: 'rgb(236, 72, 153)', accent: 'rgb(219, 39, 119)' },
    { primary: 'rgb(125, 211, 252)', secondary: 'rgb(56, 189, 248)', accent: 'rgb(14, 165, 233)' },
  ] as const,

  edge: {
    stroke: 'hsla(34.1, 100%, 62.7%, 0.5)',
    strokeHover: 'hsla(34.1, 100%, 62.7%, 0.7)',
    strokeHidden: 'hsla(34.1, 100%, 62.7%, 0)',
  },

  node: {
    strokeColor: '#fff',
    strokeWidth: 2,
    textFill: '#333',
    copyIconStroke: 'green', // The tick shown once the address is copied.
  },
} as const;

export type NodeGradient = typeof graphColors.nodeGradients[0];

/**
 * A node's colours by its index, starting again once every gradient is used.
 */
export const nodeColors = (index: number): NodeGradient => {
  return graphColors.nodeGradients[index % graphColors.nodeGradients.length];
};

/**
 * A CSS custom property's value on the root element.
 */
export const cssCustomProperty = (propertyName: string, fallback = '#666'): string => {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(propertyName).trim() || fallback;
};

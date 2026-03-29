/**
 * Centralized theme configuration for the DVP application.
 *
 * This file consolidates all color constants used throughout the application,
 * providing a single source of truth for theming and easier maintenance.
 *
 * Color System Organization:
 * - Toast colors: Used for notification styling in react-hot-toast
 * - Graph colors: Used for settlement visualization in SettlementGraph
 * - Semantic colors: Mapped to CSS custom properties for consistency
 *
 * Usage:
 * - Import specific color objects or individual colors as needed
 * - All colors use HSL/RGB format for consistency with existing codebase
 * - Semantic names provide clarity about color purpose and context
 *
 * Adding New Colors:
 * 1. Add to appropriate category (toast, graph, semantic)
 * 2. Use descriptive names that indicate purpose
 * 3. Consider relationship to existing CSS custom properties
 * 4. Update TypeScript types if creating new categories
 */

// Toast notification colors for react-hot-toast styling.
export const toastColors = {
  // Base toast appearance
  background: 'hsla(220, 45.8%, 11.6%, 1)',
  border: 'hsla(225, 48.8%, 16.1%, 1)',
  text: 'white',

  // Success toast styling.
  success: {
    primary: 'hsla(160.1, 84.1%, 39.4%, 1)',
    secondary: 'hsla(218.5, 33.9%, 77.5%, 1)',
    border: '1px solid hsla(160.1, 84.1%, 39.4%, 1)',
  },

  // Error toast styling.
  error: {
    primary: 'hsla(0, 93.2%, 65.5%, 1)',
    secondary: 'hsla(218.5, 33.9%, 77.5%, 1)',
    border: '1px solid hsla(0, 93.2%, 65.5%, 1)',
  },
} as const;

// Graph visualization colors for settlement nodes and edges.
export const graphColors = {
  // Node background gradients.
  nodeGradients: [
    {primary: 'rgb(186, 230, 253)', secondary: 'rgb(147, 197, 253)', accent: 'rgb(59, 130, 246)' }, // Ocean Blue.
    {primary: 'rgb(254, 215, 170)', secondary: 'rgb(251, 191, 36)', accent: 'rgb(245, 158, 11)' }, // Warm Orange  .
    {primary: 'rgb(187, 247, 208)', secondary: 'rgb(134, 239, 172)', accent: 'rgb(34, 197, 94)' }, // Fresh Green.
    {primary: 'rgb(254, 240, 138)', secondary: 'rgb(250, 204, 21)', accent: 'rgb(234, 179, 8)' }, // Golden Yellow.
    {primary: 'rgb(221, 214, 254)', secondary: 'rgb(196, 181, 253)', accent: 'rgb(147, 51, 234)' }, // Royal Purple.
    {primary: 'rgb(165, 243, 252)', secondary: 'rgb(103, 232, 249)', accent: 'rgb(6, 182, 212)' }, // Electric Cyan.
    {primary: 'rgb(252, 231, 243)', secondary: 'rgb(249, 168, 212)', accent: 'rgb(236, 72, 153)' }, // Rose Pink.
    {primary: 'rgb(199, 210, 254)', secondary: 'rgb(165, 180, 252)', accent: 'rgb(99, 102, 241)' }, // Indigo Dream.
    {primary: 'rgb(253, 230, 138)', secondary: 'rgb(252, 211, 77)', accent: 'rgb(251, 191, 36)' }, // Amber Glow.
    {primary: 'rgb(153, 246, 228)', secondary: 'rgb(94, 234, 212)', accent: 'rgb(20, 184, 166)' }, // Mint Teal.
    { primary: 'rgb(217, 249, 157)', secondary: 'rgb(190, 242, 100)', accent: 'rgb(132, 204, 22)' }, // Lime Fresh.
    { primary: 'rgb(244, 114, 182)', secondary: 'rgb(236, 72, 153)', accent: 'rgb(219, 39, 119)' }, // Vibrant Magenta.
    { primary: 'rgb(125, 211, 252)', secondary: 'rgb(56, 189, 248)', accent: 'rgb(14, 165, 233)' }, // Sky Blue.
  ] as const,

  // Edge and UI element colors
  edge: {
    stroke: '#999',
    arrowFill: '#999',
  },

  // Node interaction elements
  node: {
    strokeColor: '#fff',
    strokeWidth: 2,
    textFill: '#333',
    copyIconStroke: 'green', // Success state for copy button.
  },
} as const;

/**
 * Semantic color mappings that reference CSS custom properties.
 * These provide JavaScript access to the design system colors.
 */
export const semanticColors = {
  // Primary brand colors.
  primary: 'var(--color-primary)',
  primaryInteraction: 'var(--color-primary-interaction)',
  primarySubtle: 'var(--color-primary-subtle)',

  // Secondary colors.
  secondary: 'var(--color-secondary)',

  // Attention/warning colors.
  attention: 'var(--color-attention)',
  attentionSubtle: 'var(--color-attention-subtle)',

  // Interface colors.
  interfaceDark: 'var(--color-interface-dark)',
  interfaceLow: 'var(--color-interface-low)',
  interfaceBlack: 'var(--color-interface-black)',
  interfaceBorder: 'var(--color-interface-border)',

  // Text colors.
  textAnchor: 'var(--color-text-anchor)',
  textBody: 'var(--color-text-body)',
  textDisabled: 'var(--color-text-disabled)',
  textHeading: 'var(--color-text-heading)',
  textLabel: 'var(--color-text-label)',

  // Background colors.
  bodyBackground: 'var(--color-body-background)',
  cardBackground: 'var(--color-card-background)',
  inputBackground: 'var(--color-input-background)',

  // Input field colors.
  inputBorder: 'var(--color-input-border)',
  inputBorderFocus: 'var(--color-input-border-focus)',
  inputOutline: 'var(--color-input-outline)',
  inputPlaceholder: 'var(--color-input-placeholder)',

  // Button colors.
  primaryButtonBorder: 'var(--color-primary-button-border)',
  primaryButtonBackground: 'var(--color-primary-button-background)',

  // Logo colors.
  logoMain: 'var(--color-logo-main)',
  logoHighlight: 'var(--color-logo-highlight)',
} as const;

// Type definitions.
export type ToastColors = typeof toastColors;
export type GraphColors = typeof graphColors;
export type SemanticColors = typeof semanticColors;
export type NodeGradient = typeof graphColors.nodeGradients[0];

// Utility function to get node colors by index (cycles through available colors).
export const nodeColors = (index: number): NodeGradient => {
  return graphColors.nodeGradients[index % graphColors.nodeGradients.length];
};

// Utility function to get CSS custom property value at runtime.
export const cssCustomProperty = (propertyName: string, fallback = '#666'): string => {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(propertyName).trim() || fallback;
};

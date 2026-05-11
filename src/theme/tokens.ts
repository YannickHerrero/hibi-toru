// Torakaa typography, spacing, radii, and tracking tokens.

export const typography = {
  display: {
    xl: 72,
    lg: 44,
    md: 32,
    sm: 24,
  },
  body: 17,
  bodySm: 15,
  meta: 13,
  mono: {
    md: 13,
    sm: 11,
    xs: 10,
    xxs: 9,
  },
} as const;

export const space = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 22,
  s6: 32,
  s7: 48,
  s8: 64,
} as const;

// Editorial = mostly sharp; only chrome (sheets, status pill) uses rounded.
export const radii = {
  none: 0,
  sm: 2,
  md: 8,
  pill: 999,
} as const;

export const tracking = {
  tight: -0.03,
  body: -0.01,
  mono: 0.18,
  monoWide: 0.22,
} as const;

export const layout = {
  gutter: 22,
  maxWidth: 1100,
} as const;

export const lineHeight = {
  display: 0.98,
  serif: 1.35,
  sans: 1.45,
} as const;

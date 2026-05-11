// Torakaa color tokens — five editorial palettes.
// Source of truth: Torakaa Design System v1.0 (2026-05).

export type ThemeName = 'paper' | 'stone' | 'sage' | 'clay' | 'ink';

export type ColorTokens = {
  paper: string;
  paperAlt: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  ruleSoft: string;
  accent: string;
  accentSoft: string;
  muted: string;
};

export const palettes: Record<ThemeName, ColorTokens> = {
  paper: {
    paper: '#F4EBD9',
    paperAlt: '#EFE3CE',
    ink: '#2B241B',
    inkSoft: '#6B5E4E',
    inkFaint: '#A49580',
    ruleSoft: 'rgba(43,36,27,0.15)',
    accent: '#B5593A',
    accentSoft: '#D89478',
    muted: '#E5D8C0',
  },
  stone: {
    paper: '#E6E8EA',
    paperAlt: '#DDE0E3',
    ink: '#2D3338',
    inkSoft: '#5F6972',
    inkFaint: '#9BA3AB',
    ruleSoft: 'rgba(45,51,56,0.15)',
    accent: '#4A6B8A',
    accentSoft: '#89A0B8',
    muted: '#D3D7DB',
  },
  sage: {
    paper: '#DDE4D2',
    paperAlt: '#D3DBC6',
    ink: '#2C3526',
    inkSoft: '#5E6954',
    inkFaint: '#97A287',
    ruleSoft: 'rgba(44,53,38,0.15)',
    accent: '#3F5C32',
    accentSoft: '#7B9669',
    muted: '#CCD4BE',
  },
  clay: {
    paper: '#E8D4C2',
    paperAlt: '#DFC7B1',
    ink: '#3A2820',
    inkSoft: '#6E5548',
    inkFaint: '#A8907F',
    ruleSoft: 'rgba(58,40,32,0.15)',
    accent: '#9E4521',
    accentSoft: '#C27A56',
    muted: '#D9C0A8',
  },
  ink: {
    paper: '#000000',
    paperAlt: '#0A0A0A',
    ink: '#E4E1D8',
    inkSoft: '#9A9690',
    inkFaint: '#5A5752',
    ruleSoft: 'rgba(228,225,216,0.18)',
    accent: '#F5EFE0',
    accentSoft: '#C9C4B8',
    muted: '#151515',
  },
};

export const themeNames: ThemeName[] = ['paper', 'stone', 'sage', 'clay', 'ink'];

export const defaultTheme: ThemeName = 'paper';

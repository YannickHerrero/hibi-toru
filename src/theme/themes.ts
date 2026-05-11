import { type ColorTokens, palettes, type ThemeName, themeNames } from './colors';
import { fontFamilies } from './fonts';
import { layout, lineHeight, radii, space, tracking, typography } from './tokens';

export type AppTheme = {
  name: ThemeName;
  colors: ColorTokens;
  space: typeof space;
  radii: typeof radii;
  typography: typeof typography;
  tracking: typeof tracking;
  layout: typeof layout;
  lineHeight: typeof lineHeight;
  fonts: typeof fontFamilies;
};

function buildTheme(name: ThemeName): AppTheme {
  return {
    name,
    colors: palettes[name],
    space,
    radii,
    typography,
    tracking,
    layout,
    lineHeight,
    fonts: fontFamilies,
  };
}

export const themes = themeNames.reduce(
  (acc, name) => {
    acc[name] = buildTheme(name);
    return acc;
  },
  {} as Record<ThemeName, AppTheme>,
);

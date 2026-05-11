import { StyleSheet } from 'react-native-unistyles';
import { defaultTheme } from './colors';
import { themes } from './themes';

const breakpoints = {
  xs: 0,
  sm: 360,
  md: 600,
  lg: 900,
} as const;

type AppBreakpoints = typeof breakpoints;
type AppThemes = typeof themes;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes,
  breakpoints,
  settings: {
    initialTheme: defaultTheme,
  },
});

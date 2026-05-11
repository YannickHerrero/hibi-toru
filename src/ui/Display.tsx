import { Text, type TextProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Size = keyof typeof sizeMap;

const sizeMap = {
  xl: "xl",
  lg: "lg",
  md: "md",
  sm: "sm",
} as const;

type Props = TextProps & {
  size?: Size;
  italic?: boolean;
  children: React.ReactNode;
};

// Newsreader serif at display sizes — used for screen titles and hero metrics.
export function Display({ size = "md", italic, style, children, ...rest }: Props) {
  styles.useVariants({ size, italic: italic ? "yes" : "no" });
  return (
    <Text {...rest} style={[styles.text, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create((theme) => ({
  text: {
    color: theme.colors.ink,
    variants: {
      size: {
        xl: {
          fontSize: theme.typography.display.xl,
          letterSpacing: theme.typography.display.xl * theme.tracking.tight,
          lineHeight: theme.typography.display.xl * theme.lineHeight.display,
        },
        lg: {
          fontSize: theme.typography.display.lg,
          letterSpacing: theme.typography.display.lg * theme.tracking.tight,
          lineHeight: theme.typography.display.lg * theme.lineHeight.display,
        },
        md: {
          fontSize: theme.typography.display.md,
          letterSpacing: theme.typography.display.md * theme.tracking.tight,
          lineHeight: theme.typography.display.md * theme.lineHeight.display,
        },
        sm: {
          fontSize: theme.typography.display.sm,
          letterSpacing: theme.typography.display.sm * theme.tracking.tight,
          lineHeight: theme.typography.display.sm * theme.lineHeight.display,
        },
      },
      italic: {
        yes: {
          fontFamily: theme.fonts.serifItalic,
        },
        no: {
          fontFamily: theme.fonts.serif,
        },
      },
    },
  },
}));

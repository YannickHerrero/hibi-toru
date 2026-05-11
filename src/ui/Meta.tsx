import { Text, type TextProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = TextProps & {
  children: React.ReactNode;
};

// Torakaa "meta" — mono sm, uppercase, ink-soft. Used for time, units, captions.
export function Meta({ style, children, ...rest }: Props) {
  return (
    <Text {...rest} style={[styles.meta, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create((theme) => ({
  meta: {
    fontFamily: theme.fonts.mono,
    fontSize: theme.typography.mono.sm,
    color: theme.colors.inkSoft,
    letterSpacing: theme.typography.mono.sm * theme.tracking.mono,
    textTransform: "uppercase",
  },
}));

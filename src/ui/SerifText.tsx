import { Text, type TextProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = TextProps & {
  size?: number;
  italic?: boolean;
  soft?: boolean;
  children: React.ReactNode;
};

// Newsreader serif body text — list items, prose, soft secondary copy.
export function SerifText({ size, italic, soft, style, children, ...rest }: Props) {
  styles.useVariants({ italic: italic ? "yes" : "no", soft: soft ? "yes" : "no" });
  return (
    <Text {...rest} style={[styles.text, size != null ? { fontSize: size } : null, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create((theme) => ({
  text: {
    fontSize: theme.typography.body,
    lineHeight: theme.typography.body * theme.lineHeight.serif,
    color: theme.colors.ink,
    variants: {
      italic: {
        yes: {
          fontFamily: theme.fonts.serifItalic,
        },
        no: {
          fontFamily: theme.fonts.serif,
        },
      },
      soft: {
        yes: {
          color: theme.colors.inkSoft,
        },
        no: {},
      },
    },
  },
}));

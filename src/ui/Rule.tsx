import { type StyleProp, View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type RuleVariant = "solid" | "soft" | "double";

type Props = {
  variant?: RuleVariant;
  style?: StyleProp<ViewStyle>;
};

export function Rule({ variant = "solid", style }: Props) {
  styles.useVariants({ variant });
  return <View style={[styles.rule, style]} />;
}

const styles = StyleSheet.create((theme) => ({
  rule: {
    width: "100%",
    variants: {
      variant: {
        solid: {
          height: 1,
          backgroundColor: theme.colors.ink,
        },
        soft: {
          height: 1,
          backgroundColor: theme.colors.ruleSoft,
        },
        double: {
          height: 4,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderTopColor: theme.colors.ink,
          borderBottomColor: theme.colors.ink,
          backgroundColor: "transparent",
        },
      },
    },
  },
}));

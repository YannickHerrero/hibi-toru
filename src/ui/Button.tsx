import { Pressable, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Variant = "ghost" | "primary";

type Props = {
  variant?: Variant;
  onPress?: () => void;
  disabled?: boolean;
  children: string;
};

// Torakaa Button primitives — sharp corners, mono uppercase, wide tracking.
// ghost = 1px outline; primary = ink-filled, paper text.
export function Button({ variant = "ghost", onPress, disabled, children }: Props) {
  styles.useVariants({ variant, disabled: disabled ? "yes" : "no" });
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.btn}>
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  btn: {
    alignSelf: "flex-start",
    variants: {
      variant: {
        ghost: {
          borderWidth: 1,
          borderColor: theme.colors.ink,
          paddingVertical: theme.space.s2 - 2,
          paddingHorizontal: theme.space.s3,
          backgroundColor: "transparent",
        },
        primary: {
          paddingVertical: theme.space.s3,
          paddingHorizontal: theme.space.s5,
          backgroundColor: theme.colors.ink,
        },
      },
      disabled: {
        yes: { opacity: 0.4 },
        no: {},
      },
    },
  },
  label: {
    fontFamily: theme.fonts.mono,
    textTransform: "uppercase",
    variants: {
      variant: {
        ghost: {
          color: theme.colors.ink,
          fontSize: 10.5,
          letterSpacing: 10.5 * 0.2,
        },
        primary: {
          color: theme.colors.paper,
          fontSize: theme.typography.mono.sm,
          letterSpacing: theme.typography.mono.sm * theme.tracking.monoWide,
        },
      },
      disabled: { yes: {}, no: {} },
    },
  },
}));

import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
  num?: string;
  children: React.ReactNode;
  accent?: React.ReactNode;
};

// Torakaa "label" — mono xs, uppercase, wide tracking, with an optional § number prefix.
// Example: <Label num="№ 03">Color tokens · <accent>Paper</accent></Label>
export function Label({ num, children, accent }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>
        {num ? <Text style={styles.num}>{num}</Text> : null}
        {children}
        {accent ? <Text style={styles.accent}>{accent}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
  },
  text: {
    fontFamily: theme.fonts.mono,
    fontSize: theme.typography.mono.xs,
    color: theme.colors.ink,
    letterSpacing: theme.typography.mono.xs * theme.tracking.monoWide,
    textTransform: "uppercase",
  },
  num: {
    color: theme.colors.inkSoft,
    fontFamily: theme.fonts.monoMedium,
  },
  accent: {
    color: theme.colors.accent,
  },
}));

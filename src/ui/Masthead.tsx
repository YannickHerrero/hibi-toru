import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Meta } from "./Meta";

type Props = {
  left?: string;
  right?: string;
};

// Torakaa masthead — slim top header with two meta lines and a 1px ink rule.
export function Masthead({ left = "Hibi Koe", right }: Props) {
  return (
    <View style={styles.row}>
      <Meta>{left}</Meta>
      {right ? <Meta>{right}</Meta> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.space.s5,
    paddingTop: theme.space.s4,
    paddingBottom: theme.space.s2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ink,
    backgroundColor: theme.colors.paper,
  },
}));

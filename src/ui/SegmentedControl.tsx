import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export type SegmentItem<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  items: ReadonlyArray<SegmentItem<T>>;
  onChange: (value: T) => void;
};

// Horizontal row of mono-uppercase buttons separated by 1px ink dividers.
// The active segment fills with ink, paper text. Mirrors Torakaa .btn-segment.
export function SegmentedControl<T extends string>({ value, items, onChange }: Props<T>) {
  return (
    <View style={styles.row}>
      {items.map((item, index) => (
        <Segment
          key={item.value}
          label={item.label}
          active={item.value === value}
          last={index === items.length - 1}
          onPress={() => onChange(item.value)}
        />
      ))}
    </View>
  );
}

function Segment({
  label,
  active,
  last,
  onPress,
}: {
  label: string;
  active: boolean;
  last: boolean;
  onPress: () => void;
}) {
  segmentStyles.useVariants({
    active: active ? "yes" : "no",
    last: last ? "yes" : "no",
  });
  return (
    <Pressable style={segmentStyles.cell} onPress={onPress}>
      <Text style={segmentStyles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.ink,
  },
}));

const segmentStyles = StyleSheet.create((theme) => ({
  cell: {
    flex: 1,
    paddingVertical: theme.space.s3,
    alignItems: "center",
    justifyContent: "center",
    variants: {
      active: {
        yes: { backgroundColor: theme.colors.ink },
        no: { backgroundColor: "transparent" },
      },
      last: {
        yes: { borderRightWidth: 0 },
        no: { borderRightWidth: 1, borderRightColor: theme.colors.ink },
      },
    },
  },
  label: {
    fontFamily: theme.fonts.mono,
    fontSize: 10.5,
    letterSpacing: 10.5 * theme.tracking.mono,
    textTransform: "uppercase",
    variants: {
      active: {
        yes: { color: theme.colors.paper },
        no: { color: theme.colors.ink },
      },
      last: { yes: {}, no: {} },
    },
  },
}));

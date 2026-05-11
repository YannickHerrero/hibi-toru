import { TextInput, type TextInputProps, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = TextInputProps;

// Torakaa "field" — bottom-rule input with serif type, ink-faint placeholder.
export function Field(props: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput {...props} style={[styles.input, props.style]} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ink,
    paddingVertical: theme.space.s3,
  },
  input: {
    fontFamily: theme.fonts.serif,
    fontSize: theme.typography.body,
    color: theme.colors.ink,
    padding: 0,
  },
}));

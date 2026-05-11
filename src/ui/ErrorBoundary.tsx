import { Component, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

type Props = { children: ReactNode };
type State = { error: Error | null };

// Last-ditch error boundary. Uses plain RN StyleSheet (NOT Unistyles)
// so that it still renders if Unistyles is the thing that crashed.
// Catches render errors only; async errors and native crashes still
// need adb logcat.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }): void {
    console.error("Render crash", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Hibi Koe crashed.</Text>
        <Text style={styles.body}>{error.message}</Text>
        {error.stack ? <Text style={styles.stack}>{error.stack}</Text> : null}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F4EBD9",
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    color: "#2B241B",
    marginBottom: 12,
  },
  body: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#2B241B",
    marginBottom: 12,
  },
  stack: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#6B5E4E",
  },
});

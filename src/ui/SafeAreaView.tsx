// MUST come first: any leaf module that creates themed stylesheets
// needs the Unistyles runtime configured before evaluation.
import "../theme/unistyles";

import { SafeAreaView as NativeSafeAreaView } from "react-native-safe-area-context";
import { withUnistyles } from "react-native-unistyles";

// react-native-safe-area-context's SafeAreaView is a third-party
// component, so the Unistyles babel plugin doesn't auto-wrap it the
// way it wraps RN's <View>. Without withUnistyles, theme-dependent
// styles applied to it (e.g. backgroundColor: theme.colors.paper)
// are computed once at first render and never recompute on setTheme.
//
// Wrapping makes the component subscribe to theme changes and
// re-render in place.
export const SafeAreaView = withUnistyles(NativeSafeAreaView);

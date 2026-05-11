import { Tabs } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';

export default function TabsLayout() {
  const { theme } = useUnistyles();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.paper },
        headerTitleStyle: {
          color: theme.colors.ink,
          fontFamily: theme.fonts.sansSemiBold,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.paper,
          borderTopColor: theme.colors.ruleSoft,
        },
        tabBarActiveTintColor: theme.colors.ink,
        tabBarInactiveTintColor: theme.colors.inkFaint,
        tabBarLabelStyle: { fontFamily: theme.fonts.sansMedium },
      }}
    >
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved Words' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

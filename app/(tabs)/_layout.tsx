import { Tabs } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '@/constants/theme'
import { useClientOnlyValue } from '@/components/useClientOnlyValue'

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: 1,
          paddingHorizontal: theme.spacing.sm,
          // The default bar (49px) is too short for the icon + label stack, so
          // the label's descenders get clipped on web. Give the row real height;
          // the bar adds `insets.bottom` as padding on top of this itself.
          height: 62 + insets.bottom,
          paddingTop: 2,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarLabelStyle: { fontSize: 10, lineHeight: 14, paddingBottom: 2 },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'This Week',
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'calendar.badge.plus', android: 'event', web: 'event' }} tintColor={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }} tintColor={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' }} tintColor={color} size={22} />
          ),
        }}
      />
    </Tabs>
  )
}

import { Tabs } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { theme } from '@/constants/theme'
import { useClientOnlyValue } from '@/components/useClientOnlyValue'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11 },
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

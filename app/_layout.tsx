import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { ActivityIndicator, View, StatusBar } from 'react-native'
import { supabase } from '@/lib/supabase'
import { theme } from '@/constants/theme'

SplashScreen.preventAutoHideAsync()

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = { initialRouteName: '(tabs)' }

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        await supabase.auth.signInAnonymously()
      }
      setReady(true)
      SplashScreen.hideAsync()
    }
    init()
  }, [])

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    )
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Workout', headerBackTitle: 'Back' }} />
        <Stack.Screen name="workout/new" options={{ title: 'New Session', presentation: 'modal', headerBackTitle: 'Cancel' }} />
        <Stack.Screen name="exercise/[id]" options={{ title: 'Exercise', headerBackTitle: 'Back' }} />
        <Stack.Screen name="stats" options={{ title: 'Stats & Progress', headerBackTitle: 'Back' }} />
      </Stack>
    </>
  )
}

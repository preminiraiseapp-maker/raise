import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter'
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif'
import { ActivityIndicator, View, StatusBar, TouchableOpacity, Text } from 'react-native'
import { theme } from '@/constants/theme'
import { useAuth } from '@/hooks/useAuth'

SplashScreen.preventAutoHideAsync()

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = { initialRouteName: '(tabs)' }

function HomeButton() {
  const router = useRouter()
  return (
    <TouchableOpacity onPress={() => router.navigate('/(tabs)')} hitSlop={10} accessibilityLabel="Go to This Week">
      <Text style={{ color: theme.colors.accent, fontSize: theme.fontSize.md, fontFamily: theme.fonts.bodySemiBold }}>
        Home
      </Text>
    </TouchableOpacity>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  })

  const { isAuthed, loading: authLoading } = useAuth()
  const ready = (fontsLoaded || fontsError) && !authLoading

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

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
          headerRight: () => <HomeButton />,
        }}
      >
        <Stack.Protected guard={isAuthed}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="workout/[id]" options={{ title: 'Workout', headerBackTitle: 'Back' }} />
          <Stack.Screen name="workout/new" options={{ title: 'New Session', presentation: 'modal', headerBackTitle: 'Cancel' }} />
          <Stack.Screen name="exercise/[id]" options={{ title: 'Exercise', headerBackTitle: 'Back' }} />
          <Stack.Screen name="stats" options={{ title: 'Stats & Progress', headerBackTitle: 'Back' }} />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthed}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  )
}

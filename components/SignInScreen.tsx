import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { theme } from '@/constants/theme'
import { supabase } from '@/lib/supabase'

export default function SignInScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError(null)

    // Drop any leftover anonymous session so this signs in as the real account.
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user.is_anonymous) await supabase.auth.signOut()

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: cleanEmail, password })
      setLoading(false)
      if (signUpError) {
        setError(signUpError.message)
        return
      }
      if (!data.session) {
        // Email confirmation is still enabled on the project.
        setError('Account created — check your email to confirm it, then sign in.')
        setMode('signin')
      }
      // With a session, the auth listener in useAuth swaps this screen for the app.
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
    setLoading(false)
    if (signInError) setError(signInError.message)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.brand}>Raise</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to sync your workouts across devices.'
            : 'Create an account — use the same email and password on every device.'}
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          textContentType={mode === 'signin' ? 'password' : 'newPassword'}
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.btnDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.primaryBtnText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => { setMode((m) => (m === 'signin' ? 'signup' : 'signin')); setError(null) }}
          disabled={loading}
        >
          <Text style={styles.linkBtnText}>
            {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </Text>
        </TouchableOpacity>

        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    fontSize: theme.fontSize.xxxl,
    fontFamily: theme.fonts.display,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.body,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  input: {
    height: 52,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    ...theme.shadow.soft,
  },
  primaryBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.bodyBold,
    color: '#FFFFFF',
  },
  linkBtn: { alignItems: 'center', paddingVertical: theme.spacing.md, marginTop: theme.spacing.xs },
  linkBtnText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.accent,
  },
  error: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.danger,
    textAlign: 'center',
  },
})

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
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cleanEmail = email.trim().toLowerCase()

  async function sendCode() {
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      setError('Enter a valid email address.')
      return
    }
    setLoading(true)
    setError(null)

    // Drop any leftover anonymous session so this signs in as the real account.
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user.is_anonymous) await supabase.auth.signOut()

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: true },
    })
    setLoading(false)

    if (otpError) {
      setError(otpError.message)
      return
    }
    setCode('')
    setStep('code')
  }

  async function verify() {
    if (code.trim().length < 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: code.trim(),
      type: 'email',
    })
    setLoading(false)

    // On success, the auth listener in useAuth swaps this screen for the app.
    if (verifyError) setError(verifyError.message)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.brand}>Raise</Text>
        <Text style={styles.subtitle}>
          {step === 'email'
            ? 'Sign in to sync your workouts across devices.'
            : `Enter the 6-digit code we sent to ${cleanEmail}.`}
        </Text>

        {step === 'email' ? (
          <>
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
              autoFocus
              returnKeyType="go"
              onSubmitEditing={sendCode}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={sendCode}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.primaryBtnText}>Send code →</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="123456"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              autoFocus
              returnKeyType="go"
              onSubmitEditing={verify}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={verify}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.primaryBtnText}>Verify & sign in</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => { setStep('email'); setError(null); setCode('') }}
              disabled={loading}
            >
              <Text style={styles.linkBtnText}>Use a different email</Text>
            </TouchableOpacity>
          </>
        )}

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
  codeInput: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: theme.fontSize.xxl,
    letterSpacing: 8,
    textAlign: 'center',
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

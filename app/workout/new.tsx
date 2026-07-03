import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { format } from 'date-fns'
import { theme } from '@/constants/theme'
import { supabase, getUserId } from '@/lib/supabase'

export default function NewWorkoutScreen() {
  const { date, planned } = useLocalSearchParams<{ date: string; planned?: string }>()
  const router = useRouter()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const isPlanned = planned === '1'
  const dateLabel = date ? format(new Date(date + 'T00:00:00'), 'EEE d MMM yyyy') : ''

  async function create() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give this session a name.')
      return
    }
    setSaving(true)
    const userId = await getUserId()
    if (!userId) { setSaving(false); return }

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        name: name.trim(),
        date: date ?? format(new Date(), 'yyyy-MM-dd'),
        status: isPlanned ? 'planned' : 'planned',
      })
      .select()
      .single()

    setSaving(false)
    if (error || !data) {
      Alert.alert('Error', 'Could not create session.')
      return
    }
    router.replace(`/workout/${data.id}`)
  }

  const QUICK_NAMES = ['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Lower Body', 'Full Body', 'Cardio']

  return (
    <View style={styles.container}>
      <Text style={styles.dateLabel}>{dateLabel}</Text>
      <Text style={styles.heading}>{isPlanned ? 'Plan a Session' : 'New Workout'}</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Session name…"
        placeholderTextColor={theme.colors.textMuted}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={create}
      />

      <Text style={styles.quickLabel}>Quick names</Text>
      <View style={styles.quickRow}>
        {QUICK_NAMES.map((n) => (
          <TouchableOpacity key={n} style={styles.quickChip} onPress={() => setName(n)}>
            <Text style={styles.quickChipText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.createBtn, (!name.trim() || saving) && styles.createBtnDisabled]}
        onPress={create}
        disabled={!name.trim() || saving}
      >
        {saving
          ? <ActivityIndicator color={theme.colors.background} />
          : <Text style={styles.createBtnText}>{isPlanned ? 'Create Plan →' : 'Start Workout →'}</Text>
        }
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.xl },
  dateLabel: { fontSize: theme.fontSize.sm, color: theme.colors.accent, marginBottom: theme.spacing.xs, fontWeight: '600' },
  heading: { fontSize: theme.fontSize.xxxl, fontWeight: '800', color: theme.colors.text, marginBottom: theme.spacing.xl },
  input: { height: 52, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, color: theme.colors.text, fontSize: theme.fontSize.xl, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.lg },
  quickLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginBottom: theme.spacing.sm, fontWeight: '600' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  quickChip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.card, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border },
  quickChipText: { fontSize: theme.fontSize.sm, color: theme.colors.text },
  createBtn: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 'auto' },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { fontSize: theme.fontSize.lg, fontWeight: '700', color: theme.colors.background },
})

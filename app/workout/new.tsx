import { useState, useEffect } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { format } from 'date-fns'
import { theme } from '@/constants/theme'
import { supabase, getUserId } from '@/lib/supabase'
import type { WorkoutSession } from '@/types/database'

export default function NewWorkoutScreen() {
  const { date, planned } = useLocalSearchParams<{ date: string; planned?: string }>()
  const router = useRouter()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [sources, setSources] = useState<WorkoutSession[]>([])
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)

  const isPlanned = planned === '1'
  const dateLabel = date ? format(new Date(date + 'T00:00:00'), 'EEE d MMM yyyy') : ''

  useEffect(() => {
    async function loadSources() {
      const userId = await getUserId()
      if (!userId) { setSourcesLoading(false); return }
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .neq('date', date ?? '')
        .order('date', { ascending: false })
        .limit(20)
      if (error) console.error('loadSources:', error.message)
      setSources(data ?? [])
      setSourcesLoading(false)
    }
    loadSources()
  }, [date])

  function selectSource(source: WorkoutSession) {
    if (selectedSourceId === source.id) {
      setSelectedSourceId(null)
      return
    }
    setSelectedSourceId(source.id)
    if (!name.trim()) setName(source.name)
  }

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

    if (error || !data) {
      console.error('create session:', error?.message)
      setSaving(false)
      Alert.alert('Error', 'Could not create session.')
      return
    }

    if (selectedSourceId) {
      const { data: sourceSets, error: sourceSetsError } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('session_id', selectedSourceId)

      if (sourceSetsError) console.error('load source sets:', sourceSetsError.message)

      if (sourceSets && sourceSets.length > 0) {
        const { error: cloneError } = await supabase.from('workout_sets').insert(
          sourceSets.map((s) => ({
            session_id: data.id,
            exercise_id: s.exercise_id,
            exercise_order: s.exercise_order,
            set_number: s.set_number,
            is_warmup: s.is_warmup,
            planned_reps: s.actual_reps ?? s.planned_reps,
            planned_weight: s.actual_weight ?? s.planned_weight,
          })),
        )
        if (cloneError) console.error('clone source sets:', cloneError.message)
      }
    }

    setSaving(false)
    router.replace(`/workout/${data.id}`)
  }

  const QUICK_NAMES = ['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Lower Body', 'Full Body', 'Cardio']

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      <Text style={styles.quickLabel}>Copy from a previous day</Text>
      {sourcesLoading ? (
        <ActivityIndicator color={theme.colors.accent} style={{ marginBottom: theme.spacing.xl }} />
      ) : sources.length === 0 ? (
        <Text style={styles.noSources}>No previous sessions yet.</Text>
      ) : (
        <View style={styles.sourceList}>
          {sources.map((s) => {
            const selected = selectedSourceId === s.id
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sourceRow, selected && styles.sourceRowSelected]}
                onPress={() => selectSource(s)}
              >
                <View>
                  <Text style={[styles.sourceName, selected && styles.sourceNameSelected]}>{s.name}</Text>
                  <Text style={styles.sourceDate}>{format(new Date(s.date + 'T00:00:00'), 'EEE d MMM yyyy')}</Text>
                </View>
                <Text style={[styles.sourceCheck, selected && styles.sourceCheckSelected]}>
                  {selected ? '✓' : '+'}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxl },
  dateLabel: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.accent, marginBottom: theme.spacing.xs },
  heading: { fontSize: theme.fontSize.xxxl, fontFamily: theme.fonts.display, color: theme.colors.text, marginBottom: theme.spacing.xl },
  input: { height: 52, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.md, color: theme.colors.text, fontSize: theme.fontSize.xl, fontFamily: theme.fonts.body, marginBottom: theme.spacing.lg, ...theme.shadow.soft },
  quickLabel: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  quickChip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.card, borderRadius: theme.radius.full, ...theme.shadow.soft },
  quickChipText: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodyMedium, color: theme.colors.text },
  noSources: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.textMuted, marginBottom: theme.spacing.xl },
  sourceList: { marginBottom: theme.spacing.xl, gap: theme.spacing.sm },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    ...theme.shadow.soft,
  },
  sourceRowSelected: { backgroundColor: theme.colors.accentSoft },
  sourceName: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.text },
  sourceNameSelected: { color: theme.colors.text },
  sourceDate: { fontSize: theme.fontSize.xs, fontFamily: theme.fonts.body, color: theme.colors.textMuted, marginTop: 2 },
  sourceCheck: { fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bodyBold, color: theme.colors.textMuted },
  sourceCheckSelected: { color: theme.colors.accent },
  createBtn: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, height: 52, alignItems: 'center', justifyContent: 'center', ...theme.shadow.card },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bodyBold, color: theme.colors.background },
})

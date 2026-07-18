import { useState, useCallback } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, FlatList, Platform } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { format } from 'date-fns'
import { theme } from '@/constants/theme'
import { useSession } from '@/hooks/useWorkouts'
import { useExercises } from '@/hooks/useExercises'
import { supabase } from '@/lib/supabase'
import ExerciseCard from '@/components/ExerciseCard'
import RestTimer from '@/components/RestTimer'
import type { WorkoutSetWithExercise } from '@/types/database'

type SetState = WorkoutSetWithExercise & { tempReps: string; tempWeight: string }

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session, loading, refetch } = useSession(id)
  const { exercises } = useExercises()
  const [localSets, setLocalSets] = useState<SetState[]>([])
  const [showTimer, setShowTimer] = useState(false)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  // Sync server state → local state when session loads
  useFocusEffect(useCallback(() => {
    if (session?.workout_sets) {
      setLocalSets(
        session.workout_sets.map((s) => ({
          ...s,
          tempReps: String(s.actual_reps ?? s.planned_reps ?? ''),
          tempWeight: String(s.actual_weight ?? s.planned_weight ?? ''),
        }))
      )
    }
  }, [session]))

  if (loading || !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    )
  }

  const isCompleted = session.status === 'completed'

  // Group sets by exercise
  const exerciseGroups = localSets.reduce<Record<string, SetState[]>>((acc, s) => {
    const key = s.exercise_id
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const sortedExerciseIds = [...new Set(localSets.map((s) => s.exercise_id))]
    .sort((a, b) => {
      const aOrder = localSets.find((s) => s.exercise_id === a)?.exercise_order ?? 0
      const bOrder = localSets.find((s) => s.exercise_id === b)?.exercise_order ?? 0
      return aOrder - bOrder
    })

  function updateSet(setId: string, patch: Partial<SetState>) {
    setLocalSets((prev) => prev.map((s) => s.id === setId ? { ...s, ...patch } : s))
  }

  async function toggleComplete(setId: string) {
    const set = localSets.find((s) => s.id === setId)
    if (!set) return
    const newCompleted = !set.completed
    const reps = parseInt(set.tempReps) || null
    const weight = parseFloat(set.tempWeight) || null

    updateSet(setId, { completed: newCompleted, actual_reps: reps ?? undefined, actual_weight: weight ?? undefined })

    await supabase.from('workout_sets').update({
      completed: newCompleted,
      actual_reps: reps,
      actual_weight: weight,
    }).eq('id', setId)

    if (newCompleted) setShowTimer(true)
  }

  async function addSet(exerciseId: string) {
    const exerciseSets = localSets.filter((s) => s.exercise_id === exerciseId)
    const lastSet = exerciseSets[exerciseSets.length - 1]
    const setNumber = exerciseSets.length + 1
    const exerciseOrder = lastSet?.exercise_order ?? sortedExerciseIds.indexOf(exerciseId)

    const { data } = await supabase.from('workout_sets').insert({
      session_id: session.id,
      exercise_id: exerciseId,
      exercise_order: exerciseOrder,
      set_number: setNumber,
      planned_reps: lastSet?.actual_reps ?? lastSet?.planned_reps ?? null,
      planned_weight: lastSet?.actual_weight ?? lastSet?.planned_weight ?? null,
    }).select('*, exercise:exercises(*)').single()

    if (data) {
      setLocalSets((prev) => [...prev, { ...data, tempReps: String(data.planned_reps ?? ''), tempWeight: String(data.planned_weight ?? '') } as SetState])
    }
  }

  async function addExercise(exerciseId: string) {
    setShowAddExercise(false)
    const exerciseOrder = sortedExerciseIds.length

    const { data } = await supabase.from('workout_sets').insert({
      session_id: session.id,
      exercise_id: exerciseId,
      exercise_order: exerciseOrder,
      set_number: 1,
    }).select('*, exercise:exercises(*)').single()

    if (data) {
      setLocalSets((prev) => [...prev, { ...data, tempReps: '', tempWeight: '' } as SetState])
    }
  }

  async function toggleWarmup(setId: string) {
    const set = localSets.find((s) => s.id === setId)
    if (!set) return
    const newWarmup = !set.is_warmup
    updateSet(setId, { is_warmup: newWarmup })
    await supabase.from('workout_sets').update({ is_warmup: newWarmup }).eq('id', setId)
  }

  async function deleteSet(setId: string) {
    setLocalSets((prev) => prev.filter((s) => s.id !== setId))
    const { error } = await supabase.from('workout_sets').delete().eq('id', setId)
    if (error) console.error('deleteSet:', error.message)
  }

  async function deleteExercise(exerciseId: string) {
    setLocalSets((prev) => prev.filter((s) => s.exercise_id !== exerciseId))
    const { error } = await supabase.from('workout_sets').delete().eq('session_id', session.id).eq('exercise_id', exerciseId)
    if (error) console.error('deleteExercise:', error.message)
  }

  function confirmDeleteExercise(exerciseId: string, exerciseName: string) {
    const msg = `Remove ${exerciseName} and all its sets from this workout?`

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) deleteExercise(exerciseId)
      return
    }

    Alert.alert('Remove Exercise?', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteExercise(exerciseId) },
    ])
  }

  async function doComplete() {
    setSaving(true)
    await Promise.all(
      localSets.map((s) =>
        supabase.from('workout_sets').update({
          actual_reps: parseInt(s.tempReps) || null,
          actual_weight: parseFloat(s.tempWeight) || null,
        }).eq('id', s.id)
      )
    )
    await supabase.from('workout_sessions').update({ status: 'completed' }).eq('id', session.id)
    setSaving(false)
    refetch()
    router.back()
  }

  function saveAndComplete() {
    const workingSets = localSets.filter((s) => !s.is_warmup)
    const doneSets = workingSets.filter((s) => s.completed)
    const msg = workingSets.length === 0
      ? 'No sets logged yet. Complete anyway?'
      : `${doneSets.length} of ${workingSets.length} working sets done. Complete?`

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doComplete()
      return
    }

    Alert.alert('Complete Workout?', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: doComplete },
    ])
  }

  async function reopenWorkout() {
    await supabase.from('workout_sessions').update({ status: 'planned' }).eq('id', session.id)
    refetch()
  }

  async function deleteSession() {
    const { error } = await supabase.from('workout_sessions').delete().eq('id', session.id)
    if (error) {
      console.error('deleteSession:', error.message)
      return
    }
    router.replace('/(tabs)')
  }

  function confirmDeleteSession() {
    const msg = `Delete "${session.name}"? This removes the whole workout and can't be undone.`

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) deleteSession()
      return
    }

    Alert.alert('Delete Workout?', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deleteSession },
    ])
  }

  const dateLabel = format(new Date(session.date + 'T00:00:00'), 'EEE d MMM yyyy')
  const completedSets = localSets.filter((s) => s.completed && !s.is_warmup).length
  const totalSets = localSets.filter((s) => !s.is_warmup).length

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const sessionDate = new Date(session.date + 'T00:00:00')
  const isFuture = sessionDate > today

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionName}>{session.name}</Text>
              <Text style={styles.sessionDate}>{dateLabel}</Text>
            </View>
            <TouchableOpacity onPress={confirmDeleteSession} style={styles.deleteSessionBtn} hitSlop={8}>
              <Text style={styles.deleteSessionText}>🗑</Text>
            </TouchableOpacity>
          </View>
          {totalSets > 0 && (
            <View style={styles.progressPill}>
              <View style={styles.progressDot} />
              <Text style={styles.progress}>{completedSets} / {totalSets} working sets done</Text>
            </View>
          )}
        </View>

        {sortedExerciseIds.map((exerciseId) => {
          const sets = exerciseGroups[exerciseId] ?? []
          const ex = sets[0]?.exercise
          return (
            <ExerciseCard
              key={exerciseId}
              exerciseName={ex?.name ?? 'Unknown'}
              muscleGroup={ex?.muscle_group ?? null}
              sets={sets}
              onToggleComplete={toggleComplete}
              onChangeReps={(setId, val) => updateSet(setId, { tempReps: val })}
              onChangeWeight={(setId, val) => updateSet(setId, { tempWeight: val })}
              onToggleWarmup={toggleWarmup}
              onAddSet={() => addSet(exerciseId)}
              onDeleteSet={deleteSet}
              onDeleteExercise={() => confirmDeleteExercise(exerciseId, ex?.name ?? 'this exercise')}
              readonly={false}
            />
          )
        })}

        <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setShowAddExercise(true)}>
          <Text style={styles.addExerciseBtnText}>+ Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {!isFuture && (
        <View style={styles.footer}>
          {isCompleted ? (
            <TouchableOpacity style={styles.reopenBtn} onPress={reopenWorkout}>
              <Text style={styles.reopenBtnText}>Reopen Workout</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.completeBtn, saving && styles.completeBtnDisabled]}
              onPress={saveAndComplete}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={theme.colors.background} />
                : <Text style={styles.completeBtnText}>Complete Workout ✓</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      )}

      <RestTimer visible={showTimer} onDismiss={() => setShowTimer(false)} />

      <Modal visible={showAddExercise} transparent animationType="slide" onRequestClose={() => setShowAddExercise(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowAddExercise(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.exercisePickerCard}>
            <Text style={styles.pickerTitle}>Add Exercise</Text>
            <FlatList
              data={exercises}
              keyExtractor={(e) => e.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerRow} onPress={() => addExercise(item.id)}>
                  <Text style={styles.pickerName}>{item.name}</Text>
                  {item.muscle_group && <Text style={styles.pickerGroup}>{item.muscle_group}</Text>}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 400 }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 120 },
  sessionHeader: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md },
  sessionHeaderTop: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  sessionName: { fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.display, color: theme.colors.text },
  sessionDate: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.textMuted, marginTop: 4 },
  deleteSessionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardWarm,
    ...theme.shadow.soft,
  },
  deleteSessionText: { fontSize: 15 },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.cardWarm,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    marginTop: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.secondary },
  progress: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.text },
  addExerciseBtn: { marginHorizontal: theme.spacing.md, marginTop: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.colors.cardWarm, borderRadius: theme.radius.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed' },
  addExerciseBtnText: { color: theme.colors.accent, fontSize: theme.fontSize.md, fontFamily: theme.fonts.bodySemiBold },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: theme.spacing.md, backgroundColor: theme.colors.background },
  completeBtn: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, height: 56, alignItems: 'center', justifyContent: 'center', ...theme.shadow.card },
  completeBtnDisabled: { opacity: 0.5 },
  completeBtnText: { fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bodyBold, color: '#FFFFFF' },
  reopenBtn: { borderRadius: theme.radius.md, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cardWarm, ...theme.shadow.soft },
  reopenBtnText: { fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.caramel },
  backdrop: { flex: 1, backgroundColor: 'rgba(56,44,34,0.55)', justifyContent: 'flex-end' },
  exercisePickerCard: { backgroundColor: theme.colors.card, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg, padding: theme.spacing.lg, paddingBottom: 40, ...theme.shadow.floating },
  pickerTitle: { fontSize: theme.fontSize.xl, fontFamily: theme.fonts.display, color: theme.colors.text, marginBottom: theme.spacing.md },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  pickerName: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.bodyMedium, color: theme.colors.text },
  pickerGroup: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.accent },
})

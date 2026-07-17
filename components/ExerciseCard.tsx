import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '@/constants/theme'
import SetRow from './SetRow'
import type { WorkoutSetWithExercise } from '@/types/database'

type Props = {
  exerciseName: string
  muscleGroup: string | null
  sets: (WorkoutSetWithExercise & { tempReps?: string; tempWeight?: string })[]
  onToggleComplete: (setId: string) => void
  onChangeReps: (setId: string, val: string) => void
  onChangeWeight: (setId: string, val: string) => void
  onToggleWarmup: (setId: string) => void
  onAddSet: () => void
  readonly?: boolean
}

export default function ExerciseCard({
  exerciseName, muscleGroup, sets,
  onToggleComplete, onChangeReps, onChangeWeight, onToggleWarmup, onAddSet,
  readonly,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const completedCount = sets.filter((s) => s.completed).length

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => setCollapsed((c) => !c)}>
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          {muscleGroup && <Text style={styles.muscleTag}>{muscleGroup}</Text>}
        </View>
        <Text style={styles.progress}>
          {completedCount}/{sets.length} {collapsed ? '⌄' : '⌃'}
        </Text>
      </TouchableOpacity>

      {!collapsed && (
        <>
          <View style={styles.setHeader}>
            <Text style={[styles.colLabel, { width: 26 }]}>Warm</Text>
            <Text style={[styles.colLabel, { width: 18 }]}>#</Text>
            <Text style={[styles.colLabel, { width: 50 }]}>Reps</Text>
            <Text style={[styles.colLabel, { width: 14 }]}> </Text>
            <Text style={[styles.colLabel, { width: 50 }]}>kg</Text>
            <Text style={[styles.colLabel, { flex: 1 }]}>1RM</Text>
            <Text style={[styles.colLabel, { width: 32 }]}> </Text>
          </View>

          {sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              onToggleComplete={() => onToggleComplete(set.id)}
              onChangeReps={(v) => onChangeReps(set.id, v)}
              onChangeWeight={(v) => onChangeWeight(set.id, v)}
              onToggleWarmup={() => onToggleWarmup(set.id)}
              readonly={readonly}
            />
          ))}

          {!readonly && (
            <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerLeft: { flex: 1 },
  exerciseName: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  muscleTag: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.accent,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progress: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.textMuted,
  },
  setHeader: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: 6,
    gap: theme.spacing.sm,
  },
  colLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addSetBtn: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  addSetText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.accent,
  },
})

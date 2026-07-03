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
          {completedCount}/{sets.length} {collapsed ? '▶' : '▼'}
        </Text>
      </TouchableOpacity>

      {!collapsed && (
        <>
          <View style={styles.setHeader}>
            <Text style={[styles.colLabel, { width: 22 }]}>W</Text>
            <Text style={[styles.colLabel, { width: 20 }]}>#</Text>
            <Text style={[styles.colLabel, { width: 46 }]}>Reps</Text>
            <Text style={[styles.colLabel, { width: 12 }]}> </Text>
            <Text style={[styles.colLabel, { width: 46 }]}>kg</Text>
            <Text style={[styles.colLabel, { flex: 1 }]}>1RM</Text>
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
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
    fontWeight: '700',
    color: theme.colors.text,
  },
  muscleTag: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.accent,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  setHeader: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: 4,
    gap: theme.spacing.xs,
  },
  colLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  addSetBtn: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  addSetText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    fontWeight: '600',
  },
})

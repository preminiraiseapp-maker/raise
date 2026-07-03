import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { theme } from '@/constants/theme'
import { format1RM } from '@/lib/oneRepMax'
import type { WorkoutSetWithExercise } from '@/types/database'

type Props = {
  set: WorkoutSetWithExercise & { tempReps?: string; tempWeight?: string }
  onToggleComplete: () => void
  onChangeReps: (val: string) => void
  onChangeWeight: (val: string) => void
  onToggleWarmup: () => void
  readonly?: boolean
}

export default function SetRow({ set, onToggleComplete, onChangeReps, onChangeWeight, onToggleWarmup, readonly }: Props) {
  const reps = set.actual_reps ?? set.planned_reps
  const weight = set.actual_weight ?? set.planned_weight

  async function handleComplete() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onToggleComplete()
  }

  return (
    <View style={[styles.row, set.is_warmup && styles.rowWarmup, set.completed && styles.rowCompleted]}>
      <TouchableOpacity onPress={onToggleWarmup} style={styles.warmupBtn} disabled={readonly}>
        <Text style={[styles.warmupText, set.is_warmup && styles.warmupActive]}>W</Text>
      </TouchableOpacity>

      <Text style={styles.setNum}>{set.set_number}</Text>

      {readonly ? (
        <Text style={styles.valueText}>{set.actual_reps ?? '—'}</Text>
      ) : (
        <TextInput
          style={styles.input}
          value={set.tempReps ?? String(reps ?? '')}
          onChangeText={onChangeReps}
          keyboardType="number-pad"
          placeholder="reps"
          placeholderTextColor={theme.colors.textMuted}
          selectTextOnFocus
        />
      )}

      <Text style={styles.cross}>×</Text>

      {readonly ? (
        <Text style={styles.valueText}>{set.actual_weight ?? '—'}</Text>
      ) : (
        <TextInput
          style={styles.input}
          value={set.tempWeight ?? String(weight ?? '')}
          onChangeText={onChangeWeight}
          keyboardType="decimal-pad"
          placeholder="kg"
          placeholderTextColor={theme.colors.textMuted}
          selectTextOnFocus
        />
      )}

      <Text style={styles.unit}>kg</Text>

      <Text style={styles.oneRM}>
        {format1RM(
          set.actual_weight ?? set.planned_weight,
          set.actual_reps ?? set.planned_reps,
        )}
      </Text>

      {!readonly && (
        <TouchableOpacity onPress={handleComplete} style={[styles.checkBtn, set.completed && styles.checkBtnDone]}>
          <Text style={[styles.checkText, set.completed && styles.checkTextDone]}>
            {set.completed ? '✓' : '○'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    gap: theme.spacing.xs,
    marginBottom: 2,
  },
  rowWarmup: { opacity: 0.6 },
  rowCompleted: { backgroundColor: `${theme.colors.success}18` },
  warmupBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warmupText: { fontSize: 10, color: theme.colors.textMuted, fontWeight: '700' },
  warmupActive: { color: theme.colors.caramel },
  setNum: {
    width: 20,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  input: {
    width: 46,
    height: 36,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  valueText: {
    width: 46,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textAlign: 'center',
  },
  cross: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
  unit: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted },
  oneRM: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.caramel,
    textAlign: 'right',
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: { borderColor: theme.colors.success, backgroundColor: `${theme.colors.success}22` },
  checkText: { fontSize: 16, color: theme.colors.textMuted },
  checkTextDone: { color: theme.colors.success, fontWeight: '700' },
})

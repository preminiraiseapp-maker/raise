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
  onDelete: () => void
  readonly?: boolean
}

export default function SetRow({ set, onToggleComplete, onChangeReps, onChangeWeight, onToggleWarmup, onDelete, readonly }: Props) {
  const reps = set.actual_reps ?? set.planned_reps
  const weight = set.actual_weight ?? set.planned_weight

  async function handleComplete() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onToggleComplete()
  }

  return (
    <View style={[styles.row, set.is_warmup && styles.rowWarmup, set.completed && styles.rowCompleted]}>
      <TouchableOpacity
        onPress={onToggleWarmup}
        style={[styles.warmupBtn, set.is_warmup && styles.warmupBtnActive]}
        disabled={readonly}
      >
        <Text style={[styles.warmupText, set.is_warmup && styles.warmupTextActive]}>W</Text>
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
          placeholder="—"
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
          placeholder="—"
          placeholderTextColor={theme.colors.textMuted}
          selectTextOnFocus
        />
      )}

      <Text style={styles.oneRM}>
        {format1RM(
          set.actual_weight ?? set.planned_weight,
          set.actual_reps ?? set.planned_reps,
        )}
      </Text>

      {!readonly && (
        <TouchableOpacity onPress={handleComplete} style={[styles.checkBtn, set.completed && styles.checkBtnDone]}>
          <Text style={[styles.checkText, set.completed && styles.checkTextDone]}>
            {set.completed ? '✓' : ''}
          </Text>
        </TouchableOpacity>
      )}

      {!readonly && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
          <Text style={styles.deleteText}>✕</Text>
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
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  rowWarmup: { backgroundColor: `${theme.colors.caramel}17` },
  rowCompleted: { backgroundColor: `${theme.colors.secondary}1c` },
  warmupBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warmupBtnActive: { backgroundColor: theme.colors.caramel },
  warmupText: { fontSize: 11, fontFamily: theme.fonts.bodyBold, color: theme.colors.textMuted },
  warmupTextActive: { color: '#FFFFFF' },
  setNum: {
    width: 18,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  input: {
    width: 50,
    height: 38,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodySemiBold,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  valueText: {
    width: 50,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  cross: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.textMuted },
  oneRM: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.accent,
    textAlign: 'right',
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: { borderColor: theme.colors.secondary, backgroundColor: theme.colors.secondary },
  checkText: { fontSize: 15, fontFamily: theme.fonts.bodyBold, color: theme.colors.textMuted },
  checkTextDone: { color: '#FFFFFF' },
  deleteBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { fontSize: 13, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textMuted },
})

import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '@/constants/theme'
import type { WorkoutSessionWithSets } from '@/types/database'
import type { MuscleGroup } from '@/types/database'

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

type Props = {
  sessions: WorkoutSessionWithSets[]
}

export default function MuscleGroupBar({ sessions }: Props) {
  const setCounts: Record<string, number> = {}

  for (const session of sessions) {
    if (session.status !== 'completed') continue
    for (const set of session.workout_sets ?? []) {
      if (set.is_warmup) continue
      const group = set.exercise?.muscle_group
      if (group) setCounts[group] = (setCounts[group] ?? 0) + 1
    }
  }

  const maxSets = Math.max(...Object.values(setCounts), 1)

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Muscle Balance</Text>
      {MUSCLE_GROUPS.map((group) => {
        const count = setCounts[group] ?? 0
        const pct = count / maxSets
        const isEmpty = count === 0

        return (
          <View key={group} style={styles.row}>
            <Text style={[styles.label, isEmpty && styles.labelEmpty]}>{group}</Text>
            <View style={styles.barBg}>
              {!isEmpty && (
                <LinearGradient
                  colors={[theme.colors.secondary, theme.colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${Math.max(pct * 100, 6)}%` }]}
                />
              )}
            </View>
            <Text style={[styles.count, isEmpty && styles.labelEmpty]}>
              {count > 0 ? `${count}` : '—'}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  heading: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  label: {
    width: 78,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.text,
  },
  labelEmpty: {
    color: theme.colors.textMuted,
  },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: theme.radius.full,
    minWidth: 8,
  },
  count: {
    width: 22,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.text,
    textAlign: 'right',
  },
})

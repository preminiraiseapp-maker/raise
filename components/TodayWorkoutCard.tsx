import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '@/constants/theme'
import type { WorkoutSessionWithSets } from '@/types/database'

type Props = {
  session: WorkoutSessionWithSets | null
  onPress: () => void
}

export default function TodayWorkoutCard({ session, onPress }: Props) {
  if (!session) {
    return (
      <TouchableOpacity style={[styles.card, styles.cardEmpty]} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>+</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.emptyTitle}>Nothing planned for today</Text>
          <Text style={styles.emptySubtitle}>Tap to add a workout</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const workingSets = session.workout_sets?.filter((s) => !s.is_warmup) ?? []
  const completedSets = workingSets.filter((s) => s.completed).length
  const isCompleted = session.status === 'completed'

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.rowTop}>
        <Text style={styles.eyebrow}>Today's Workout</Text>
        <View style={[styles.statusPill, isCompleted && styles.statusPillDone]}>
          <Text style={[styles.statusText, isCompleted && styles.statusTextDone]}>
            {isCompleted ? 'Completed' : 'Planned'}
          </Text>
        </View>
      </View>
      <Text style={styles.name}>{session.name}</Text>
      {workingSets.length > 0 && (
        <Text style={styles.meta}>{completedSets} / {workingSets.length} working sets done</Text>
      )}
      <Text style={styles.cta}>{isCompleted ? 'View workout' : 'Continue workout'} →</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  cardEmpty: {
    backgroundColor: theme.colors.cardWarm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconText: {
    fontSize: 20,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.accent,
  },
  emptyTitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.body,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  eyebrow: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.accentSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statusPillDone: {
    backgroundColor: theme.colors.secondary,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.cardWarm,
  },
  statusTextDone: {
    color: theme.colors.text,
  },
  name: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.display,
    color: theme.colors.cardWarm,
    marginBottom: 4,
  },
  meta: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.body,
    color: theme.colors.accentSoft,
    marginBottom: theme.spacing.md,
  },
  cta: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.cardWarm,
  },
})

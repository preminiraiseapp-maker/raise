import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { format, isToday, isBefore } from 'date-fns'
import { theme } from '@/constants/theme'
import type { WeekDay } from '@/hooks/useWeek'
import type { WorkoutSessionWithSets } from '@/types/database'

type Props = {
  days: WeekDay[]
  sessions: WorkoutSessionWithSets[]
  onDayPress: (dateStr: string, session: WorkoutSessionWithSets | null) => void
}

export default function WeekGrid({ days, sessions, onDayPress }: Props) {
  const sessionByDate = Object.fromEntries(sessions.map((s) => [s.date, s]))

  return (
    <View style={styles.grid}>
      {days.map((day) => {
        const session = sessionByDate[day.dateStr] ?? null
        const past = isBefore(day.date, new Date()) && !isToday(day.date)
        const today = isToday(day.date)
        const completed = session?.status === 'completed'
        const planned = session?.status === 'planned'

        let cardStyle = [styles.card]
        if (today) cardStyle.push(styles.cardToday as any)
        if (completed) cardStyle.push(styles.cardCompleted as any)
        if (planned) cardStyle.push(styles.cardPlanned as any)

        return (
          <TouchableOpacity
            key={day.dateStr}
            style={cardStyle}
            onPress={() => onDayPress(day.dateStr, session)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayName, today && styles.textToday]}>{day.dayName}</Text>
            <Text style={[styles.dayNum, today && styles.textToday]}>{day.dayNum}</Text>
            {completed && (
              <>
                <Text style={styles.sessionName} numberOfLines={1}>{session.name}</Text>
                <Text style={styles.sessionMeta}>
                  {session.workout_sets?.filter((s) => !s.is_warmup).length ?? 0} sets
                </Text>
                <View style={styles.completedDot} />
              </>
            )}
            {planned && (
              <>
                <Text style={styles.sessionNamePlanned} numberOfLines={1}>{session.name}</Text>
                <Text style={styles.sessionMeta}>Planned</Text>
              </>
            )}
            {!session && (
              <Text style={[styles.plusIcon, past && styles.pastPlus]}>+</Text>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  card: {
    width: '13%',
    flexGrow: 1,
    minHeight: 90,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardToday: {
    borderColor: theme.colors.accent,
    borderWidth: 1.5,
  },
  cardCompleted: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.success,
  },
  cardPlanned: {
    borderColor: theme.colors.secondary,
    borderStyle: 'dashed',
  },
  dayName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  dayNum: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  textToday: {
    color: theme.colors.accent,
  },
  sessionName: {
    fontSize: 9,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  sessionNamePlanned: {
    fontSize: 9,
    color: theme.colors.secondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  sessionMeta: {
    fontSize: 8,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
    marginTop: 4,
  },
  plusIcon: {
    fontSize: 22,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  pastPlus: {
    opacity: 0.3,
  },
})

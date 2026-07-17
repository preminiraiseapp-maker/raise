import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { isToday, isBefore } from 'date-fns'
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.grid}
    >
      {days.map((day) => {
        const session = sessionByDate[day.dateStr] ?? null
        const past = isBefore(day.date, new Date()) && !isToday(day.date)
        const today = isToday(day.date)
        const completed = session?.status === 'completed'
        const planned = session?.status === 'planned'

        let cardStyle = [styles.card]
        if (today) cardStyle.push(styles.cardToday as any)
        if (completed) cardStyle.push(styles.cardCompleted as any)

        return (
          <TouchableOpacity
            key={day.dateStr}
            style={cardStyle}
            onPress={() => onDayPress(day.dateStr, session)}
            activeOpacity={0.75}
          >
            <Text style={[styles.dayName, today && styles.textToday]}>{day.dayName}</Text>
            <Text style={[styles.dayNum, today && styles.textToday]}>{day.dayNum}</Text>

            <View style={styles.indicatorWrap}>
              {completed && <View style={styles.dotCompleted} />}
              {planned && <View style={styles.dotPlanned} />}
              {!session && <View style={[styles.dotEmpty, past && styles.dotPast]} />}
            </View>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  card: {
    width: 56,
    minHeight: 84,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...theme.shadow.soft,
  },
  cardToday: {
    backgroundColor: theme.colors.accentSoft,
  },
  cardCompleted: {
    backgroundColor: theme.colors.secondarySoft,
  },
  dayName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodySemiBold,
  },
  dayNum: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
  },
  textToday: {
    color: theme.colors.text,
  },
  indicatorWrap: {
    height: 8,
    justifyContent: 'center',
    marginTop: 2,
  },
  dotCompleted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
  },
  dotPlanned: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  dotEmpty: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  dotPast: {
    opacity: 0.5,
  },
})

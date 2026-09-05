import { useMemo } from 'react'
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { format, subDays, isToday, isYesterday } from 'date-fns'
import { theme } from '@/constants/theme'

type Props = {
  selectedDate: string // yyyy-MM-dd
  onSelect: (dateStr: string) => void
  daysBack?: number // how many days before today to show, in addition to today
}

// Horizontally-scrolling row of day pills (oldest -> today) so a log entry
// can be backdated to any of the last `daysBack` days, not just today.
export default function DayPicker({ selectedDate, onSelect, daysBack = 6 }: Props) {
  const days = useMemo(() => {
    const list = []
    for (let i = daysBack; i >= 0; i--) {
      const date = subDays(new Date(), i)
      list.push({
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        dayName: isToday(date) ? 'Today' : isYesterday(date) ? 'Yest' : format(date, 'EEE'),
        dayNum: format(date, 'd'),
      })
    }
    return list
  }, [daysBack])

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {days.map((day) => {
        const selected = day.dateStr === selectedDate
        return (
          <TouchableOpacity
            key={day.dateStr}
            style={[styles.pill, selected && styles.pillSelected]}
            onPress={() => onSelect(day.dateStr)}
            activeOpacity={0.75}
          >
            <Text style={[styles.dayName, selected && styles.textSelected]}>{day.dayName}</Text>
            <Text style={[styles.dayNum, selected && styles.textSelected]}>{day.dayNum}</Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

export function dayPickerLabel(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  if (isToday(date)) return 'today'
  if (isYesterday(date)) return 'yesterday'
  return format(date, 'EEE d MMM')
}

const styles = StyleSheet.create({
  scroll: { marginBottom: theme.spacing.sm },
  row: { gap: theme.spacing.xs, paddingRight: theme.spacing.xs },
  pill: {
    minWidth: 50,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pillSelected: {
    backgroundColor: theme.colors.accentSoft,
  },
  dayName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.bodySemiBold,
  },
  dayNum: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
  },
  textSelected: {
    color: theme.colors.accent,
  },
})
